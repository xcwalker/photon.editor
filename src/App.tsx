import { useEffect, useMemo, useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { type AutoItem, type ParsedEMV, type Selection, parseLuaForEMV, serializeEMVAuto, serializeEMVSelections } from './luaParser'
import { removeAutoAndAdjust } from './autoUtils'

function App() {
  const [luaText, setLuaText] = useState<string>('')
  const [parsed, setParsed] = useState<ParsedEMV>({ auto: [], selections: [] })
  const [error, setError] = useState<string | null>(null)
  const [includeAutoUsageComments, setIncludeAutoUsageComments] = useState<boolean>(true)
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
  }>({ open: false })
  // transient highlight management for validation quick-jumps
  useEffect(() => {
    const highlightTarget = (id: string) => {
      const el = document.getElementById(id)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.style.transition = 'background-color 300ms ease'
      const original = el.style.backgroundColor
      el.style.backgroundColor = 'rgba(255, 235, 59, 0.35)'
      setTimeout(() => {
        el.style.backgroundColor = original || ''
      }, 900)
    }
    const onHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '')
      if (hash) highlightTarget(hash)
    }
    window.addEventListener('hashchange', onHashChange)
    // run once on mount if a hash is already present
    onHashChange()
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Parse Lua when input changes (avoid setState inside effects lint warning)
  const handleLuaChange = (text: string) => {
    setLuaText(text)
    try {
      const p = parseLuaForEMV(text)
      setParsed(p)
      setError(null)
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'Failed to parse Lua'
      setError(message)
    }
  }

  // Example autoload removed: only load via button to keep empty input showing no selections

  const autoByIndex = useMemo(() => {
    const map = new Map<number, AutoItem>()
    parsed.auto.forEach((a) => map.set(a.index, a))
    return map
  }, [parsed.auto])

  const updateAutoItem = (index: number, changes: Partial<AutoItem>) => {
    setParsed((prev) => ({
      ...prev,
      auto: prev.auto.map((a) => (a.index === index ? { ...a, ...changes } : a)),
    }))
  }

  // Remove an Auto item and adjust all indices in autos and selections
  const removeAutoItem = (removeIndex: number) => {
    setParsed((prev) => removeAutoAndAdjust(prev, removeIndex))
  }

  const addAutoItem = () => {
    setParsed((prev) => {
      const nextIndex = prev.auto.length + 1
      const newItem: AutoItem = {
        index: nextIndex,
        ID: 'New Component',
        Scale: 1,
        Pos: { x: 0, y: 0, z: 0 },
        Ang: { p: 0, y: 0, r: 0 },
        Color1: 'AMBER',
        Color2: 'AMBER',
      }
      return { ...prev, auto: [...prev.auto, newItem] }
    })
  }

  // Create a new empty Auto item and link its index to a specific sub-group option
  const addLinkedAutoToOption = (selectionIdx: number, optionIdx: number) => {
    setParsed((prev) => {
      const nextIndex = prev.auto.length + 1
      const newItem: AutoItem = {
        index: nextIndex,
        ID: 'New Component',
        Scale: 1,
        Pos: { x: 0, y: 0, z: 0 },
        Ang: { p: 0, y: 0, r: 0 },
        Color1: 'AMBER',
        Color2: 'AMBER',
      }
      const newAuto = [...prev.auto, newItem]
      const newSelections = prev.selections.map((s, si) => {
        if (si !== selectionIdx) return s
        return {
          ...s,
          Options: s.Options.map((o, oi) => {
            if (oi !== optionIdx) return o
            return { ...o, Auto: [...o.Auto, nextIndex] }
          })
        }
      })
      return { ...prev, auto: newAuto, selections: newSelections }
    })
  }

  // Unlink an existing Auto index from a specific option within a selection (no global reindex)
  const unlinkAutoFromOption = (selectionIdx: number, optionIdx: number, autoIndex: number) => {
    setParsed((prev) => ({
      ...prev,
      selections: prev.selections.map((s, si) => {
        if (si !== selectionIdx) return s
        return {
          ...s,
          Options: s.Options.map((o, oi) => {
            if (oi !== optionIdx) return o
            return { ...o, Auto: o.Auto.filter((n) => n !== autoIndex) }
          })
        }
      })
    }))
  }

  const serializedAuto = useMemo(
    () => serializeEMVAuto(parsed.auto, includeAutoUsageComments ? parsed.selections : undefined),
    [parsed.auto, parsed.selections, includeAutoUsageComments]
  )
  const serializedSelections = useMemo(() => serializeEMVSelections(parsed.selections), [parsed.selections])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      toast.success('Copied to clipboard')
    }
  }

  const downloadText = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const usageGroups = useMemo(() => {
    // Map selection name -> set of auto indices used anywhere in its options
    const map = new Map<string, Set<number>>()
    parsed.selections.forEach((sel) => {
      const set = map.get(sel.Name) ?? new Set<number>()
      sel.Options.forEach((opt) => opt.Auto.forEach((idx) => set.add(idx)))
      map.set(sel.Name, set)
    })
    // Convert to array with resolved items
    return Array.from(map.entries()).map(([name, set]) => ({
      name,
      indices: Array.from(set.values()).sort((a, b) => a - b),
    }))
  }, [parsed.selections])

  const autoReferenceCounts = useMemo(() => {
    const counts = new Map<number, number>()
    parsed.selections.forEach((sel) => {
      sel.Options.forEach((opt) => {
        opt.Auto.forEach((idx) => counts.set(idx, (counts.get(idx) ?? 0) + 1))
      })
    })
    return counts
  }, [parsed.selections])

  const validationIssues = useMemo(() => {
    const issues: { selection: string; optionIndex: number; message: string; anchor?: string }[] = []
    // Prevent duplicate messages (same anchor, option index, and message)
    const seen = new Set<string>()
    // Detect duplicate group names (excluding empty names)
    const nameCounts = new Map<string, number>()
    parsed.selections.forEach((s) => {
      const n = s.Name.trim()
      if (n) nameCounts.set(n, (nameCounts.get(n) ?? 0) + 1)
    })
    parsed.selections.forEach((sel, si) => {
      const selAnchor = sel.Name.trim() ? `sel-${sel.Name}` : `sel-${si}`
      // Group-level validation: warn when selection/group has no name
      if (!sel.Name.trim()) {
        const k = `${selAnchor}|-1|Group has no name`
        if (!seen.has(k)) {
          issues.push({ selection: sel.Name || '(unnamed)', optionIndex: -1, message: 'Group has no name', anchor: selAnchor })
          seen.add(k)
        }
      }
      // Warn if a group name is duplicated
      const trimmedName = sel.Name.trim()
      if (trimmedName && (nameCounts.get(trimmedName) ?? 0) > 1) {
        const k = `${selAnchor}|-1|Duplicate group name`
        if (!seen.has(k)) {
          issues.push({ selection: trimmedName, optionIndex: -1, message: 'Duplicate group name', anchor: selAnchor })
          seen.add(k)
        }
      }
      sel.Options.forEach((opt, oi) => {
        if (!opt.Name.trim()) {
          const k = `${selAnchor}|${oi}|Option has no name`
          if (!seen.has(k)) {
            issues.push({ selection: sel.Name || '(unnamed)', optionIndex: oi, message: 'Option has no name', anchor: selAnchor })
            seen.add(k)
          }
        }
        const isNone = opt.Name.trim().toLowerCase() === 'none'
        if (opt.Auto.length === 0) {
          if (!isNone) {
            const k = `${selAnchor}|${oi}|Option has no Auto indices`
            if (!seen.has(k)) {
              issues.push({ selection: sel.Name || '(unnamed)', optionIndex: oi, message: 'Option has no Auto indices', anchor: selAnchor })
              seen.add(k)
            }
          }
        } else {
          const missing = opt.Auto.filter((n) => !autoByIndex.has(n))
          if (missing.length) {
            const msg = `Missing Auto indices: ${missing.join(', ')}`
            const k = `${selAnchor}|${oi}|${msg}`
            if (!seen.has(k)) {
              issues.push({ selection: sel.Name || '(unnamed)', optionIndex: oi, message: msg, anchor: selAnchor })
              seen.add(k)
            }
          }
        }
      })
    })
    // Add EMV.Auto items that are not referenced anywhere
    parsed.auto.forEach((a) => {
      const count = autoReferenceCounts.get(a.index) ?? 0
      if (count === 0) {
        issues.push({ selection: `Auto #${a.index} – ${a.ID}`, optionIndex: -1, message: 'Auto item not referenced in any selection', anchor: `auto-${a.index}` })
      }
    })
    return issues
  }, [parsed.selections, parsed.auto, autoByIndex, autoReferenceCounts])

  const issuesBySelection = useMemo(() => {
    const map = new Map<string, { count: number; messages: string[] }>()
    validationIssues.forEach((v) => {
      const entry = map.get(v.selection) ?? { count: 0, messages: [] }
      entry.count += 1
      const label = v.optionIndex >= 0 ? `Option ${v.optionIndex + 1}` : 'Group'
      entry.messages.push(`${label}: ${v.message}`)
      map.set(v.selection, entry)
    })
    return map
  }, [validationIssues])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16, display: 'grid', gap: 16 }}>
  <h1 style={{ margin: 0 }}>Photon EMV Editor</h1>
  <Toaster position="bottom-right" />
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false })}
      />

      {validationIssues.length > 0 && (
        <WarningBox title="Validation Issues" variant="error">
          <div style={{ display: 'grid', gap: 6 }}>
            {validationIssues.map((v, i) => (
              <div key={`issue-${i}`}>
                <a
                  href={v.anchor
                    ? `#${v.anchor}`
                    : (v.optionIndex >= 0
                      ? `#sel-${encodeURIComponent(v.selection)}-opt-${v.optionIndex}`
                      : `#sel-${encodeURIComponent(v.selection)}`)}
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  {v.selection} · {v.optionIndex >= 0 ? `Option ${v.optionIndex + 1}` : 'Group'}
                </a>: {v.message}
              </div>
            ))}
          </div>
        </WarningBox>
      )}

      <SectionWrapper title="Lua Source" defaultOpen>
        <section style={{ display: 'grid', gap: 8 }}>
        <label htmlFor="luainput" style={{ fontWeight: 600 }}>Paste Lua</label>
        <textarea
          id="luainput"
          placeholder="Paste your Lua here (containing EMV.Auto and EMV.Selections)"
          value={luaText}
          onChange={(e) => handleLuaChange(e.target.value)}
          style={{ width: '100%', height: 200, fontFamily: 'monospace', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={async () => {
            try {
              const res = await fetch('/example.lua')
              if (res.ok) {
                const text = await res.text()
                handleLuaChange(text)
              }
            } catch (err) {
              console.warn('Failed to load example.lua', err)
            }
          }}>Load example.lua</button>
          <button onClick={() => handleLuaChange('')}>Clear</button>
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div style={{ fontSize: 12, color: '#666' }}>
          Parsed: {parsed.auto.length} Auto items · {parsed.selections.length} selections
        </div>
        </section>
      </SectionWrapper>

      <SectionWrapper title="EMV.Selections">
        <section style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => {
            setParsed((prev) => ({
              ...prev,
              selections: [...prev.selections, { Name: '', Options: [] }]
            }))
            toast.success('Added group')
          }}>Add Group</button>
        </div>
        {parsed.selections.map((sel, i) => (
          <div key={`sel-${i}`}>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {(() => {
                    const itemCount = new Set<number>(sel.Options.flatMap((o) => o.Auto)).size
                    return (
                      <>
                        <span style={{ fontWeight: 700 }}>{sel.Name || '(unnamed)'}</span> · {sel.Options.length} option{sel.Options.length === 1 ? '' : 's'} · {itemCount} item{itemCount === 1 ? '' : 's'}
                      </>
                    )
                  })()}
                  {sel.Name.trim() === '' && (
                    <span style={{ marginLeft: 8, color: '#b00020', fontSize: 12 }}>Name required</span>
                  )}
                  {issuesBySelection.has(sel.Name) && (
                    <span style={{ marginLeft: 8, color: '#b00020', fontSize: 12 }}>
                      {issuesBySelection.get(sel.Name)!.count} issue{issuesBySelection.get(sel.Name)!.count === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </summary>
              <div style={{ marginTop: 8 }}>
                {sel.Name.trim() === '' && (
                  <WarningBox title="Warning" variant="error" style={{ marginBottom: 8 }}>
                    <div>This group has no name. Please set a descriptive name.</div>
                  </WarningBox>
                )}
                {issuesBySelection.has(sel.Name) && (
                  <WarningBox title="Group Issues" variant="error" style={{ marginBottom: 8 }}>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {issuesBySelection.get(sel.Name)!.messages.map((msg, idx) => (
                        <li key={`gissue-${i}-${idx}`}>{msg}</li>
                      ))}
                    </ul>
                  </WarningBox>
                )}
                <SelectionEditor
                  anchorId={`sel-${sel.Name.trim() ? sel.Name : i}`}
                  selection={sel}
                  autoByIndex={autoByIndex}
                  autoReferenceCounts={autoReferenceCounts}
                  onChangeAuto={updateAutoItem}
                  onAddLinkedAuto={(optIdx) => addLinkedAutoToOption(i, optIdx)}
                  onUnlinkAuto={(optIdx, autoIdx) => {
                    unlinkAutoFromOption(i, optIdx, autoIdx)
                    toast.success(`Unlinked Auto #${autoIdx} from option`)
                  }}
                  
                  onRenameSelection={(newName) => {
                    const trimmed = newName.trim()
                    // Prevent accidental blank or 'None' names overriding parsed names
                    if (!trimmed || trimmed.toLowerCase() === 'none') return
                    setParsed((prev) => ({
                      ...prev,
                      selections: prev.selections.map((s, si) => si === i ? { ...s, Name: trimmed } : s)
                    }))
                  }}
                  onChangeOption={(optIdx, changes) => {
                    setParsed((prev) => ({
                      ...prev,
                      selections: prev.selections.map((s, si) => si === i ? {
                        ...s,
                        Options: s.Options.map((o, i2) => i2 === optIdx ? { ...o, ...changes } : o)
                      } : s)
                    }))
                  }}
                  onAddOption={() => {
                    setParsed((prev) => ({
                      ...prev,
                      selections: prev.selections.map((s, si) => si === i ? {
                        ...s,
                        Options: [...s.Options, { Name: 'New Option', Auto: [] }]
                      } : s)
                    }))
                    toast.success('Added option')
                  }}
                  onConfirmRemoveOption={(optIdx, optName, selName) => {
                    setConfirmState({
                      open: true,
                      title: 'Remove Option',
                      message: `Remove option "${optName}" from group "${selName}"? This cannot be undone.`,
                      confirmText: 'Remove',
                      cancelText: 'Cancel',
                      onConfirm: () => {
                        setConfirmState({ open: false })
                        setParsed((prev) => ({
                          ...prev,
                          selections: prev.selections.map((s, si) => si === i ? {
                            ...s,
                            Options: s.Options.filter((_, i2) => i2 !== optIdx)
                          } : s)
                        }))
                        toast.success('Option removed')
                      }
                    })
                  }}
                  onMoveOption={(fromIdx, dir) => {
                    setParsed((prev) => ({
                      ...prev,
                      selections: prev.selections.map((s, si) => {
                        if (si !== i) return s
                        const toIdx = fromIdx + (dir === 'up' ? -1 : 1)
                        if (toIdx < 0 || toIdx >= s.Options.length) return s
                        const newOpts = [...s.Options]
                        const [item] = newOpts.splice(fromIdx, 1)
                        newOpts.splice(toIdx, 0, item)
                        return { ...s, Options: newOpts }
                      })
                    }))
                  }}
                  onMoveAutoIndex={(optIdx, indexPos, dir) => {
                    setParsed((prev) => ({
                      ...prev,
                      selections: prev.selections.map((s, si) => {
                        if (si !== i) return s
                        const opt = s.Options[optIdx]
                        if (!opt) return s
                        const toPos = indexPos + (dir === 'up' ? -1 : 1)
                        if (toPos < 0 || toPos >= opt.Auto.length) return s
                        const newAuto = [...opt.Auto]
                        const [val] = newAuto.splice(indexPos, 1)
                        newAuto.splice(toPos, 0, val)
                        const newOpts = s.Options.map((o, i2) => i2 === optIdx ? { ...o, Auto: newAuto } : o)
                        return { ...s, Options: newOpts }
                      })
                    }))
                  }}
                  onConfirmRemoveAuto={(autoIdx, label) => {
                    setConfirmState({
                      open: true,
                      title: 'Remove Auto',
                      message: `Remove Auto item ${label}? This will adjust indices in selections.`,
                      confirmText: 'Remove',
                      cancelText: 'Cancel',
                      onConfirm: () => {
                        setConfirmState({ open: false })
                        removeAutoItem(autoIdx)
                        toast.success(`Removed Auto ${label}`)
                      }
                    })
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={() => {
                    setConfirmState({
                      open: true,
                      title: 'Remove Group',
                      message: `Remove group "${sel.Name}"? This cannot be undone.`,
                      confirmText: 'Remove',
                      cancelText: 'Cancel',
                      onConfirm: () => {
                        setConfirmState({ open: false })
                        setParsed((prev) => ({
                          ...prev,
                          selections: prev.selections.filter((_, si) => si !== i)
                        }))
                        toast.success('Group removed')
                      }
                    })
                  }}>Remove Group</button>
                </div>
              </div>
            </details>
          </div>
        ))}
        </section>
      </SectionWrapper>

      <SectionWrapper title="Auto Usage by Selection">
        <section style={{ display: 'grid', gap: 12 }}>
        {usageGroups.map((group) => (
          <div key={group.name} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{group.name}</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {group.indices.length === 0 && <div style={{ color: '#666' }}>No Auto items referenced</div>}
              {group.indices.map((idx) => {
                const item = autoByIndex.get(idx)
                return item ? (
                  <AutoItemEditor
                    key={`${group.name}-${idx}`}
                    item={item}
                    onChange={(ch) => updateAutoItem(idx, ch)}
                    compact
                    referenceCount={autoReferenceCounts.get(idx) ?? 0}
                  />
                ) : (
                  <div key={`${group.name}-missing-${idx}`} style={{ color: 'red' }}>Missing Auto index {idx}</div>
                )
              })}
            </div>
          </div>
        ))}
        </section>
      </SectionWrapper>

      <SectionWrapper title="EMV.Auto">
        <section style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={addAutoItem}>Add Item</button>
          </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {parsed.auto.map((a) => (
            <AutoItemEditor
              key={a.index}
              anchorId={`auto-${a.index}`}
              item={a}
              onChange={(ch) => updateAutoItem(a.index, ch)}
              onConfirmRemove={() => {
                setConfirmState({
                  open: true,
                  title: 'Remove Auto',
                  message: `Remove Auto item #${a.index} – ${a.ID}? This will adjust indices in selections.`,
                  confirmText: 'Remove',
                  cancelText: 'Cancel',
                  onConfirm: () => {
                    setConfirmState({ open: false })
                    removeAutoItem(a.index)
                    toast.success(`Removed Auto #${a.index}`)
                  }
                })
              }}
              referenceCount={autoReferenceCounts.get(a.index) ?? 0}
            />
          ))}
        </div>
        </section>
      </SectionWrapper>

      <SectionWrapper title="Lua Output (EMV.Auto)">
        <section style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => copyToClipboard(serializedAuto)}>Copy</button>
            <button onClick={() => downloadText('EMV.Auto.lua', serializedAuto)}>Download</button>
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
            <input
              type="checkbox"
              checked={includeAutoUsageComments}
              onChange={(e) => setIncludeAutoUsageComments(e.target.checked)}
            />
            Include usage comments
          </label>
          <textarea readOnly value={serializedAuto} style={{ width: '100%', height: 200, fontFamily: 'monospace' }} />
        </section>
      </SectionWrapper>

      <SectionWrapper title="Lua Output (EMV.Selections)">
        <section style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => copyToClipboard(serializedSelections)}>Copy</button>
            <button onClick={() => downloadText('EMV.Selections.lua', serializedSelections)}>Download</button>
          </div>
          <textarea readOnly value={serializedSelections} style={{ width: '100%', height: 200, fontFamily: 'monospace', resize: 'vertical' }} />
        </section>
      </SectionWrapper>
    </div>
  )
}

function SelectionEditor({
  anchorId,
  selection,
  autoByIndex,
  autoReferenceCounts,
  onChangeAuto,
  onUnlinkAuto,
  onRenameSelection,
  onChangeOption,
  onAddOption,
  onAddLinkedAuto,
  onMoveOption,
  onMoveAutoIndex,
  onConfirmRemoveOption,
  onConfirmRemoveAuto,
}: {
  anchorId?: string
  selection: Selection
  autoByIndex: Map<number, AutoItem>
  autoReferenceCounts: Map<number, number>
  onChangeAuto: (index: number, changes: Partial<AutoItem>) => void
  onUnlinkAuto: (optIdx: number, autoIndex: number) => void
  onAddLinkedAuto: (optIdx: number) => void
  onRenameSelection: (newName: string) => void
  onChangeOption: (optIdx: number, changes: Partial<{ Name: string; Auto: number[] }>) => void
  onAddOption: () => void
  onMoveOption: (fromIdx: number, dir: 'up' | 'down') => void
  onMoveAutoIndex: (optIdx: number, indexPos: number, dir: 'up' | 'down') => void
  onConfirmRemoveOption: (optIdx: number, optName: string, selName: string) => void
  onConfirmRemoveAuto: (autoIdx: number, label: string) => void
}) {
  // Bind directly to selection.Name to avoid effect-driven state sync
  // Track compact/full mode per option (sub-group) within this selection
  const [compactOptionMap, setCompactOptionMap] = useState<Map<number, boolean>>(new Map())
  const isOptionCompact = (optIdx: number) => compactOptionMap.get(optIdx) ?? true // default to compact (true)
  const toggleOptionCompact = (optIdx: number) => {
    setCompactOptionMap((prev) => {
      const next = new Map(prev)
      next.set(optIdx, !(prev.get(optIdx) ?? true))
      return next
    })
  }
  return (
    <div id={anchorId} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input
          value={selection.Name}
          onChange={(e) => {
            const v = e.target.value
            const trimmed = v.trim()
            if (trimmed && trimmed.toLowerCase() !== 'none') {
              onRenameSelection(trimmed)
            }
          }}
          placeholder="New Group"
          autoFocus={selection.Name.trim() === ''}
          style={{ fontWeight: 600 }}
        />
        <button onClick={onAddOption}>Add Option</button>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {selection.Options.map((opt, optIdx) => (
          <div
            id={`${anchorId}-opt-${optIdx}`}
            key={optIdx}
            style={{
              display: 'grid',
              gap: 8,
              border: '1px solid #c3c3c3',
              borderRadius: 8,
              padding: 10,
              background: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={opt.Name}
                onChange={(e) => onChangeOption(optIdx, { Name: e.target.value })}
                style={{ fontWeight: 500 }}
              />
              <button onClick={() => onMoveOption(optIdx, 'up')}>Move Up</button>
              <button onClick={() => onMoveOption(optIdx, 'down')}>Move Down</button>
              <button onClick={() => toggleOptionCompact(optIdx)}>
                {isOptionCompact(optIdx) ? 'Switch to full editor' : 'Switch to compact editor'}
              </button>
              <button onClick={() => onConfirmRemoveOption(optIdx, opt.Name, selection.Name)}>Remove</button>
            </div>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 500, margin: '4px 0' }}>
                Autolinked items{opt.Auto.length > 0 ? ` · ${opt.Auto.length}` : ''}
              </summary>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '6px 0' }}>
                <button onClick={() => onAddLinkedAuto(optIdx)}>Add empty Auto item and append its index</button>
                <span style={{ fontSize: 12, color: '#666' }}>(New item will be appended to EMV.Auto and its index added to this option)</span>
              </div>
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {opt.Auto.length === 0 && <div style={{ color: '#666' }}>No linked Auto items</div>}
                {opt.Auto.map((idx) => {
                  const item = autoByIndex.get(idx)
                  if (!item) return (
                    <div key={idx} style={{ color: 'red' }}>Missing Auto index {idx}</div>
                  )
                  return (
                    <AutoItemEditor
                      key={`${optIdx}-${idx}`}
                      item={item}
                      onChange={(ch) => onChangeAuto(idx, ch)}
                      onConfirmRemove={() => onConfirmRemoveAuto(idx, `#${idx} – ${item.ID}`)}
                      compact={isOptionCompact(optIdx)}
                      referenceCount={autoReferenceCounts.get(idx) ?? 0}
                    />
                  )
                })}
                {/* Unlink controls per auto index within this option */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {opt.Auto.map((autoIdx) => (
                    <button key={`unlink-${optIdx}-${autoIdx}`} onClick={() => onUnlinkAuto(optIdx, autoIdx)}>
                      Unlink #{autoIdx} from this option
                    </button>
                  ))}
                </div>
              </div>
            </details>
            <div style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#666' }}>Auto indices (comma-separated)</span>
              <input
                value={opt.Auto.join(', ')}
                onChange={(e) => {
                  const nums = e.target.value
                    .split(/[,\s]+/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s) => parseInt(s, 10))
                    .filter((n) => !Number.isNaN(n))
                  onChangeOption(optIdx, { Auto: nums })
                }}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {opt.Auto.map((_, i) => (
                  <span key={`ctl-${i}`} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                    <button onClick={() => onMoveAutoIndex(optIdx, i, 'up')}>↑ {i+1}</button>
                    <button onClick={() => onMoveAutoIndex(optIdx, i, 'down')}>↓ {i+1}</button>
                  </span>
                ))}
              </div>
              {opt.Auto.some((n) => !autoByIndex.has(n)) && (
                <div style={{ color: 'red' }}>Warning: Option references missing Auto indices.</div>
              )}
            </div>
            {optIdx < selection.Options.length - 1 && (
              <div style={{ width: '100%', borderTop: '1px dashed #c3c3c3', margin: '12px 0' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function AutoItemEditor({
  item,
  onChange,
  onConfirmRemove,
  compact,
  referenceCount,
  anchorId,
}: {
  item: AutoItem
  onChange: (changes: Partial<AutoItem>) => void
  onConfirmRemove?: () => void
  compact?: boolean
  referenceCount?: number
  anchorId?: string
}) {
  const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }
  return (
    <div id={anchorId} style={{ border: '1px solid #c3c3c3', borderRadius: 8, padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 500 }}>#{item.index} – {item.ID}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, color: referenceCount ? '#666' : '#b00020' }}>
            {referenceCount ? `Referenced in ${referenceCount} option${referenceCount === 1 ? '' : 's'}` : 'Warning: Not referenced in any selection'}
          </div>
          {onConfirmRemove && (
            <button
              onClick={() => onConfirmRemove?.()}
            >Remove</button>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>ID</span>
          <input value={item.ID} onChange={(e) => onChange({ ID: e.target.value })} />
        </label>
        {!compact && (
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Scale</span>
            <input
              type="number"
              step="0.01"
              value={item.Scale ?? ''}
              onChange={(e) => onChange({ Scale: parseFloat(e.target.value) })}
            />
          </label>
        )}
        {!compact && (
          <div style={rowStyle}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Pos X</span>
              <input
                type="number"
                step="0.01"
                value={item.Pos?.x ?? ''}
                onChange={(e) => onChange({ Pos: { ...(item.Pos ?? { x: 0, y: 0, z: 0 }), x: parseFloat(e.target.value) } })}
              />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Pos Y</span>
              <input
                type="number"
                step="0.01"
                value={item.Pos?.y ?? ''}
                onChange={(e) => onChange({ Pos: { ...(item.Pos ?? { x: 0, y: 0, z: 0 }), y: parseFloat(e.target.value) } })}
              />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Pos Z</span>
              <input
                type="number"
                step="0.01"
                value={item.Pos?.z ?? ''}
                onChange={(e) => onChange({ Pos: { ...(item.Pos ?? { x: 0, y: 0, z: 0 }), z: parseFloat(e.target.value) } })}
              />
            </label>
          </div>
        )}
        {!compact && (
          <div style={rowStyle}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Ang P</span>
              <input
                type="number"
                step="0.01"
                value={item.Ang?.p ?? ''}
                onChange={(e) => onChange({ Ang: { ...(item.Ang ?? { p: 0, y: 0, r: 0 }), p: parseFloat(e.target.value) } })}
              />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Ang Y</span>
              <input
                type="number"
                step="0.01"
                value={item.Ang?.y ?? ''}
                onChange={(e) => onChange({ Ang: { ...(item.Ang ?? { p: 0, y: 0, r: 0 }), y: parseFloat(e.target.value) } })}
              />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Ang R</span>
              <input
                type="number"
                step="0.01"
                value={item.Ang?.r ?? ''}
                onChange={(e) => onChange({ Ang: { ...(item.Ang ?? { p: 0, y: 0, r: 0 }), r: parseFloat(e.target.value) } })}
              />
            </label>
          </div>
        )}
        <div style={rowStyle}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Color1</span>
            <input value={item.Color1 ?? ''} onChange={(e) => onChange({ Color1: e.target.value })} />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Color2</span>
            <input value={item.Color2 ?? ''} onChange={(e) => onChange({ Color2: e.target.value })} />
          </label>
          {!compact && (
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Phase</span>
              <input value={item.Phase ?? ''} onChange={(e) => onChange({ Phase: e.target.value })} />
            </label>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

function SectionWrapper({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <div style={{ border: '2px solid #c3c3c3', background: '#f9fafb', borderRadius: 12, padding: 12 }}>
      <details open={!!defaultOpen}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, marginBottom: 8, color: '#374151' }}>{title}</summary>
        {children}
      </details>
    </div>
  )
}

function WarningBox({
  title,
  children,
  variant = 'error',
  style,
}: {
  title?: string
  children: React.ReactNode
  variant?: 'error' | 'warning' | 'info'
  style?: React.CSSProperties
}) {
  const palette = {
    error: {
      border: '#f5c2c7',
      bg: '#f8d7da',
      color: '#842029',
    },
    warning: {
      border: '#ffe69c',
      bg: '#fff3cd',
      color: '#664d03',
    },
    info: {
      border: '#b6d4fe',
      bg: '#cfe2ff',
      color: '#084298',
    },
  } as const
  const theme = palette[variant]
  return (
    <div style={{ border: `1px solid ${theme.border}`, background: theme.bg, color: theme.color, padding: 12, borderRadius: 8, ...(style ?? {}) }}>
      {title && <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>}
      {children}
    </div>
  )
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: 380, maxWidth: '90vw', background: '#fff', border: '2px solid #c3c3c3', borderRadius: 12, boxShadow: '0 10px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: 700, color: '#374151' }}>{title ?? 'Confirm'}</div>
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ marginBottom: 12 }}>{message}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {cancelText && (
              <button onClick={onCancel}>{cancelText}</button>
            )}
            <button onClick={onConfirm}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
