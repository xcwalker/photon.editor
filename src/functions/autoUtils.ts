import { type ParsedEMV } from './luaParser'

/**
 * Remove an Auto item by index and adjust all indices in autos and selections.
 * - Removes the auto with removeIndex
 * - Decrements indices greater than removeIndex
 * - Removes references to removeIndex from selections
 */
export function removeAutoAndAdjust(parsed: ParsedEMV, removeIndex: number): ParsedEMV {
  const remaining = parsed.auto.filter((a) => a.index !== removeIndex)
  const reindexed = remaining
    .map((a) => ({
      ...a,
      index: a.index > removeIndex ? a.index - 1 : a.index,
    }))
    .sort((a, b) => a.index - b.index)

  const newSelections = parsed.selections.map((s) => ({
    ...s,
    Options: s.Options.map((o) => ({
      ...o,
      Auto: o.Auto.filter((n) => n !== removeIndex).map((n) => (n > removeIndex ? n - 1 : n)),
    })),
  }))

  return { ...parsed, auto: reindexed, selections: newSelections }
}
