import fs from "fs"
import path from "path"

type CdpTarget = {
  id: string
  type: string
  title: string
  url: string
  webSocketDebuggerUrl?: string
}

type RecorderOptions = {
  port: number
  durationSeconds: number
  traceSeconds: number
  metricsIntervalMs: number
  outputDir: string
  label: string
  targetUrlFragment?: string
}

const DEFAULT_TRACE_CATEGORIES = [
  "devtools.timeline",
  "v8",
  "blink.user_timing",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.frame",
].join(",")

function parseOptions(argv: string[]): RecorderOptions {
  const get = (name: string, fallback?: string) => {
    const index = argv.indexOf(name)
    return index >= 0 ? argv[index + 1] : fallback
  }

  return {
    port: Number(get("--port", "9333")),
    durationSeconds: Number(get("--duration-seconds", "0")),
    traceSeconds: Number(get("--trace-seconds", "0")),
    metricsIntervalMs: Number(get("--metrics-interval-ms", "1000")),
    outputDir: get("--output-dir", "tmp/perf")!,
    label: get("--label", "renderer-perf")!,
    targetUrlFragment: get("--target-url-fragment"),
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

function pickTarget(targets: CdpTarget[], fragment?: string): CdpTarget {
  const pages = targets.filter((target) => target.type === "page" && target.webSocketDebuggerUrl)
  const exact = fragment
    ? pages.find((target) => target.url.includes(fragment))
    : pages.find((target) => {
        try {
          return new URL(target.url).pathname === "/"
        } catch {
          return target.url === "/"
        }
      })

  const fallback = pages.find((target) => !target.url.includes("/panel")) ?? pages[0]
  if (!exact && !fallback) {
    throw new Error("No renderer page targets found on the CDP endpoint")
  }
  return exact ?? fallback
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2))
  const outputDir = path.resolve(process.cwd(), options.outputDir)
  fs.mkdirSync(outputDir, { recursive: true })

  const sessionId = new Date().toISOString().replace(/[:.]/g, "-")
  const baseName = `${options.label}-${sessionId}`
  const metricsPath = path.join(outputDir, `${baseName}.metrics.jsonl`)
  const tracePath = path.join(outputDir, `${baseName}.trace.json`)
  const metaPath = path.join(outputDir, `${baseName}.meta.json`)
  const baseUrl = `http://127.0.0.1:${options.port}`
  const targets = await fetchJson<CdpTarget[]>(`${baseUrl}/json/list`)
  const target = pickTarget(targets, options.targetUrlFragment)

  const metricsStream = fs.createWriteStream(metricsPath, { flags: "a" })
  const traceEvents: unknown[] = []
  const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>()
  let nextId = 1
  let traceCompleteResolver: (() => void) | null = null
  let metricsTimer: ReturnType<typeof setInterval> | null = null
  let stopped = false
  let traceStarted = false

  const websocket = new WebSocket(target.webSocketDebuggerUrl!)
  await new Promise<void>((resolve, reject) => {
    websocket.addEventListener("open", () => resolve(), { once: true })
    websocket.addEventListener("error", () => reject(new Error("Failed to connect to renderer CDP websocket")), { once: true })
  })

  const send = <T>(method: string, params?: Record<string, unknown>) => {
    const id = nextId++
    websocket.send(JSON.stringify({ id, method, params }))
    return new Promise<T>((resolve, reject) => pending.set(id, { resolve, reject }))
  }

  websocket.addEventListener("message", async (event) => {
    const raw = typeof event.data === "string" ? event.data : await new Response(event.data).text()
    const payload = JSON.parse(raw)

    if (payload.id) {
      const request = pending.get(payload.id)
      if (!request) return
      pending.delete(payload.id)
      if (payload.error) request.reject(new Error(payload.error.message || "Unknown CDP error"))
      else request.resolve(payload.result)
      return
    }

    if (payload.method === "Tracing.dataCollected") {
      traceEvents.push(...(payload.params?.value ?? []))
    }

    if (payload.method === "Tracing.tracingComplete") {
      traceCompleteResolver?.()
    }
  })

  const stop = async (reason: string) => {
    if (stopped) return
    stopped = true
    if (metricsTimer) clearInterval(metricsTimer)

    if (traceStarted) {
      const complete = new Promise<void>((resolve) => {
        traceCompleteResolver = resolve
      })
      await send("Tracing.end")
      await complete
      fs.writeFileSync(tracePath, JSON.stringify({ traceEvents }, null, 2))
    }

    fs.writeFileSync(
      metaPath,
      JSON.stringify(
        {
          sessionId,
          stoppedAt: new Date().toISOString(),
          reason,
          options,
          target: { id: target.id, title: target.title, url: target.url },
          metricsPath,
          tracePath: traceStarted ? tracePath : null,
          traceEventCount: traceEvents.length,
        },
        null,
        2,
      ),
    )

    await new Promise<void>((resolve) => metricsStream.end(() => resolve()))
    websocket.close()
    console.log(`[renderer-perf-recorder] Saved metrics to ${metricsPath}`)
    if (traceStarted) console.log(`[renderer-perf-recorder] Saved trace to ${tracePath}`)
    console.log(`[renderer-perf-recorder] Saved metadata to ${metaPath}`)
  }

  process.on("SIGINT", () => void stop("SIGINT").then(() => process.exit(0)))
  process.on("SIGTERM", () => void stop("SIGTERM").then(() => process.exit(0)))

  await send("Performance.enable")
  await send("Runtime.enable")

  if (options.traceSeconds > 0) {
    traceStarted = true
    await send("Tracing.start", {
      categories: DEFAULT_TRACE_CATEGORIES,
      transferMode: "ReportEvents",
    })
    setTimeout(() => void stop(`trace-complete-${options.traceSeconds}s`).then(() => process.exit(0)), options.traceSeconds * 1000)
  }

  metricsTimer = setInterval(async () => {
    try {
      const performanceResult = await send<{ metrics: Array<{ name: string; value: number }> }>("Performance.getMetrics")
      const pageResult = await send<{ result: { value?: unknown } }>("Runtime.evaluate", {
        expression:
          "(() => ({ href: location.href, title: document.title, visibilityState: document.visibilityState, domNodes: document.getElementsByTagName('*').length }))()",
        returnByValue: true,
      })
      const metrics = Object.fromEntries(performanceResult.metrics.map((metric) => [metric.name, metric.value]))
      metricsStream.write(`${JSON.stringify({ capturedAt: new Date().toISOString(), metrics, page: pageResult.result?.value ?? null })}\n`)
    } catch (error) {
      metricsStream.write(`${JSON.stringify({ capturedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) })}\n`)
    }
  }, options.metricsIntervalMs)

  console.log(`[renderer-perf-recorder] Connected to ${target.title} (${target.url})`)
  console.log(`[renderer-perf-recorder] Writing metrics to ${metricsPath}`)

  if (options.durationSeconds > 0 && options.traceSeconds === 0) {
    setTimeout(() => void stop(`duration-complete-${options.durationSeconds}s`).then(() => process.exit(0)), options.durationSeconds * 1000)
    return
  }

  if (options.durationSeconds === 0 && options.traceSeconds === 0) {
    console.log("[renderer-perf-recorder] Recording until interrupted")
    return
  }
}

main().catch((error) => {
  console.error("[renderer-perf-recorder] Failed:", error)
  process.exit(1)
})