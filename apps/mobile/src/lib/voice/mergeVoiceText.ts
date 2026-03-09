const normalizeVoiceText = (text?: string) => (text || '').replace(/\s+/g, ' ').trim();

export function mergeVoiceText(finalText: string, liveText: string): string {
  const finalClean = normalizeVoiceText(finalText);
  const liveClean = normalizeVoiceText(liveText);

  if (!finalClean) return liveClean;
  if (!liveClean) return finalClean;
  if (liveClean === finalClean) return finalClean;
  if (liveClean.startsWith(finalClean)) return liveClean;
  if (finalClean.startsWith(liveClean)) return finalClean;

  const finalWords = finalClean.split(' ');
  const liveWords = liveClean.split(' ');
  const maxOverlap = Math.min(finalWords.length, liveWords.length);

  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    const finalTail = finalWords.slice(finalWords.length - overlap).join(' ');
    const liveHead = liveWords.slice(0, overlap).join(' ');
    if (finalTail === liveHead) {
      return `${finalClean} ${liveWords.slice(overlap).join(' ')}`.trim();
    }
  }

  return `${finalClean} ${liveClean}`.trim();
}