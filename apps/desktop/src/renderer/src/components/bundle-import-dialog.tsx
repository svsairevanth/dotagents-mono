import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import { Button } from "@renderer/components/ui/button"
import { Label } from "@renderer/components/ui/label"
import { Switch } from "@renderer/components/ui/switch"
import { Badge } from "@renderer/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@renderer/components/ui/select"
import { Loader2, AlertTriangle, Package, Bot, Server, Sparkles, Clock, Brain } from "lucide-react"
import { tipcClient } from "@renderer/lib/tipc-client"
import { toast } from "sonner"

type ConflictStrategy = "skip" | "overwrite" | "rename"

interface BundleManifest {
  version: number
  name: string
  description?: string
  createdAt: string
  exportedFrom: string
  components: {
    agentProfiles: number
    mcpServers: number
    skills: number
    repeatTasks: number
    memories: number
  }
}

interface PreviewConflict {
  id: string
  name: string
  existingName?: string
}

interface BundlePreview {
  success: boolean
  filePath?: string
  bundle?: {
    manifest: BundleManifest
  }
  conflicts?: {
    agentProfiles: PreviewConflict[]
    mcpServers: PreviewConflict[]
    skills: PreviewConflict[]
    repeatTasks: PreviewConflict[]
    memories: PreviewConflict[]
  }
  error?: string
}

interface BundleImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function BundleImportDialog({ open, onOpenChange, onImportComplete }: BundleImportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<BundlePreview | null>(null)
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>("skip")
  const [components, setComponents] = useState({
    agentProfiles: true,
    mcpServers: true,
    skills: true,
    repeatTasks: true,
    memories: true,
  })

  // Reset state when dialog opens
  useEffect(() => {
    if (open && !preview) {
      handleSelectFile()
    }
  }, [open])

  const handleSelectFile = async () => {
    setLoading(true)
    try {
      // First, open file dialog and get basic preview
      const dialogResult = await tipcClient.previewBundle()
      if (!dialogResult) {
        // User cancelled file picker
        onOpenChange(false)
        return
      }
      // Then, get full preview with conflicts
      const fullResult = await tipcClient.previewBundleWithConflicts({ filePath: dialogResult.filePath })
      setPreview(fullResult as BundlePreview)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to preview bundle: ${errorMessage}`)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!preview?.filePath) return
    setImporting(true)
    try {
      const result = await tipcClient.importBundle({
        filePath: preview.filePath,
        conflictStrategy,
        components,
      })
      if (result.success) {
        const imported = [
          result.agentProfiles.filter(r => r.action !== "skipped").length,
          result.mcpServers.filter(r => r.action !== "skipped").length,
          result.skills.filter(r => r.action !== "skipped").length,
          result.repeatTasks.filter(r => r.action !== "skipped").length,
          result.memories.filter(r => r.action !== "skipped").length,
        ].reduce((a, b) => a + b, 0)
        toast.success(`Successfully imported ${imported} item(s)`)
        onImportComplete()
        handleClose()
      } else {
        toast.error(result.errors.join(", ") || "Import failed")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Import failed: ${errorMessage}`)
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setPreview(null)
    setConflictStrategy("skip")
    setComponents({ agentProfiles: true, mcpServers: true, skills: true, repeatTasks: true, memories: true })
    onOpenChange(false)
  }

  const manifest = preview?.bundle?.manifest
  const conflicts = preview?.conflicts
  const hasConflicts = conflicts && (
    conflicts.agentProfiles.length > 0 ||
    conflicts.mcpServers.length > 0 ||
    conflicts.skills.length > 0 ||
    conflicts.repeatTasks.length > 0 ||
    conflicts.memories.length > 0
  )

  const toggleComponent = (key: keyof typeof components) => {
    setComponents(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Import Bundle
          </DialogTitle>
          <DialogDescription>
            Preview and import a .dotagents bundle file.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {preview?.error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {preview.error}
          </div>
        )}

        {manifest && (
          <div className="space-y-4">
            {/* Bundle info */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <h4 className="font-medium">{manifest.name}</h4>
              {manifest.description && (
                <p className="text-sm text-muted-foreground mt-1">{manifest.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Created: {new Date(manifest.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Component selection */}
            <div className="space-y-2">
              <Label>Components to import</Label>
              <div className="space-y-2 rounded-lg border p-3">
                <ComponentRow
                  icon={Bot}
                  label="Agent Profiles"
                  count={manifest.components.agentProfiles}
                  conflicts={conflicts?.agentProfiles.length ?? 0}
                  checked={components.agentProfiles}
                  onToggle={() => toggleComponent("agentProfiles")}
                />
                <ComponentRow
                  icon={Server}
                  label="MCP Servers"
                  count={manifest.components.mcpServers}
                  conflicts={conflicts?.mcpServers.length ?? 0}
                  checked={components.mcpServers}
                  onToggle={() => toggleComponent("mcpServers")}
                />
                <ComponentRow
                  icon={Sparkles}
                  label="Skills"
                  count={manifest.components.skills}
                  conflicts={conflicts?.skills.length ?? 0}
                  checked={components.skills}
                  onToggle={() => toggleComponent("skills")}
                />
                <ComponentRow
                  icon={Clock}
                  label="Repeat Tasks"
                  count={manifest.components.repeatTasks}
                  conflicts={conflicts?.repeatTasks.length ?? 0}
                  checked={components.repeatTasks}
                  onToggle={() => toggleComponent("repeatTasks")}
                />
                <ComponentRow
                  icon={Brain}
                  label="Memories"
                  count={manifest.components.memories}
                  conflicts={conflicts?.memories.length ?? 0}
                  checked={components.memories}
                  onToggle={() => toggleComponent("memories")}
                />
              </div>
            </div>

            {/* Conflict strategy */}
            {hasConflicts && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <Label>Handle conflicts</Label>
                </div>
                <Select value={conflictStrategy} onValueChange={(v) => setConflictStrategy(v as ConflictStrategy)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip existing items</SelectItem>
                    <SelectItem value="overwrite">Overwrite existing items</SelectItem>
                    <SelectItem value="rename">Rename imported items</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Some items already exist in your configuration.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!preview?.filePath || importing || loading}>
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ComponentRowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
  conflicts: number
  checked: boolean
  onToggle: () => void
}

function ComponentRow({ icon: Icon, label, count, conflicts, checked, onToggle }: ComponentRowProps) {
  if (count === 0) return null
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <Switch checked={checked} onCheckedChange={onToggle} disabled={count === 0} />
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
        {conflicts > 0 && (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
            {conflicts} conflict{conflicts > 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    </div>
  )
}

