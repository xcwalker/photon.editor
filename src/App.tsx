import { useEffect, useMemo, useState } from 'react'
import { type AutoItem, type ParsedEMV, type Selection, parseLuaForEMV, serializeEMVAuto, serializeEMVSelections } from './luaParser'

function App() {
  const [luaText, setLuaText] = useState<string>('')
  const [parsed, setParsed] = useState<ParsedEMV>({ auto: [], selections: [] })
  const [error, setError] = useState<string | null>(null)
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

  useEffect(() => {
    try {
      const p = parseLuaForEMV(luaText)
      setParsed(p)
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to parse Lua')
    }
  }, [luaText])

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

  const serializedAuto = useMemo(() => serializeEMVAuto(parsed.auto), [parsed.auto])
  const serializedSelections = useMemo(() => serializeEMVSelections(parsed.selections), [parsed.selections])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      alert('Copied to clipboard')
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
    const issues: { selection: string; optionIndex: number; message: string }[] = []
    parsed.selections.forEach((sel) => {
      // Group-level validation: warn when selection/group has no name
      if (!sel.Name.trim()) {
        issues.push({ selection: sel.Name || '(unnamed)', optionIndex: -1, message: 'Group has no name' })
      }
      sel.Options.forEach((opt, oi) => {
        if (!opt.Name.trim()) {
          issues.push({ selection: sel.Name, optionIndex: oi, message: 'Option has no name' })
        }
        const isNone = opt.Name.trim().toLowerCase() === 'none'
        if (opt.Auto.length === 0) {
          if (!isNone) {
            issues.push({ selection: sel.Name, optionIndex: oi, message: 'Option has no Auto indices' })
          }
        } else {
          const missing = opt.Auto.filter((n) => !autoByIndex.has(n))
          if (missing.length) {
            issues.push({ selection: sel.Name, optionIndex: oi, message: `Missing Auto indices: ${missing.join(', ')}` })
          }
        }
      })
    })
    return issues
  }, [parsed.selections, autoByIndex])

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

      <details open>
        <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>Lua Source</summary>
        <section style={{ display: 'grid', gap: 8 }}>
        {validationIssues.length > 0 && (
          <div style={{ border: '1px solid #f5c2c7', background: '#f8d7da', color: '#842029', padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Validation Issues</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {validationIssues.map((v, i) => (
                <div key={`issue-${i}`}>
                  <a
                    href={v.optionIndex >= 0
                      ? `#sel-${encodeURIComponent(v.selection)}-opt-${v.optionIndex}`
                      : `#sel-${encodeURIComponent(v.selection)}`}
                    style={{ color: '#842029', textDecoration: 'underline' }}
                  >
                    {v.selection} · {v.optionIndex >= 0 ? `Option ${v.optionIndex + 1}` : 'Group'}
                  </a>: {v.message}
                </div>
              ))}
            </div>
          </div>
        )}
        <label htmlFor="luainput" style={{ fontWeight: 600 }}>Paste Lua</label>
        <textarea
          id="luainput"
          placeholder="Paste your Lua here (containing EMV.Auto and EMV.Selections)"
          value={luaText}
          onChange={(e) => setLuaText(e.target.value)}
          style={{ width: '100%', height: 200, fontFamily: 'monospace' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={async () => {
            try {
              const res = await fetch('/example.lua')
              if (res.ok) setLuaText(await res.text())
            } catch {}
          }}>Load example.lua</button>
          <button onClick={() => setLuaText('')}>Clear</button>
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div style={{ fontSize: 12, color: '#666' }}>
          Parsed: {parsed.auto.length} Auto items · {parsed.selections.length} selections
        </div>
        </section>
      </details>

      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>EMV.Selections</summary>
        <section style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => {
            setParsed((prev) => ({
              ...prev,
              selections: [...prev.selections, { Name: '', Options: [] }]
            }))
          }}>Add Group</button>
        </div>
        {parsed.selections.map((sel, i) => (
          <div key={`sel-${i}`}>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>{sel.Name || '(unnamed)'}</span> · {sel.Options.length} option{sel.Options.length === 1 ? '' : 's'}
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
                  <div style={{ border: '1px solid #f5c2c7', background: '#f8d7da', color: '#842029', padding: 8, borderRadius: 6, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>Warning</div>
                    <div>This group has no name. Please set a descriptive name.</div>
                  </div>
                )}
                {issuesBySelection.has(sel.Name) && (
                  <div style={{ border: '1px solid #f5c2c7', background: '#f8d7da', color: '#842029', padding: 8, borderRadius: 6, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Group Issues</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {issuesBySelection.get(sel.Name)!.messages.map((msg, idx) => (
                        <li key={`gissue-${i}-${idx}`}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <SelectionEditor
                  anchorId={`sel-${sel.Name}`}
                  selection={sel}
                  autoByIndex={autoByIndex}
                  onChangeAuto={updateAutoItem}
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
                  }}
                  onRemoveOption={(optIdx) => {
                    setParsed((prev) => ({
                      ...prev,
                      selections: prev.selections.map((s, si) => si === i ? {
                        ...s,
                        Options: s.Options.filter((_, i2) => i2 !== optIdx)
                      } : s)
                    }))
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
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={() => {
                    if (confirm(`Remove group "${sel.Name}"? This cannot be undone.`)) {
                      setParsed((prev) => ({
                        ...prev,
                        selections: prev.selections.filter((_, si) => si !== i)
                      }))
                    }
                  }}>Remove Group</button>
                </div>
              </div>
            </details>
          </div>
        ))}
        </section>
      </details>

      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>Auto Usage by Selection</summary>
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
      </details>

      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>EMV.Auto</summary>
        <section style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={addAutoItem}>Add Item</button>
          </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {parsed.auto.map((a) => (
            <AutoItemEditor
              key={a.index}
              item={a}
              onChange={(ch) => updateAutoItem(a.index, ch)}
              referenceCount={autoReferenceCounts.get(a.index) ?? 0}
            />
          ))}
        </div>
        </section>
      </details>

      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>Lua Output (EMV.Auto)</summary>
        <section style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => copyToClipboard(serializedAuto)}>Copy</button>
            <button onClick={() => downloadText('EMV.Auto.lua', serializedAuto)}>Download</button>
          </div>
          <textarea readOnly value={serializedAuto} style={{ width: '100%', height: 200, fontFamily: 'monospace' }} />
        </section>
      </details>

      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>Lua Output (EMV.Selections)</summary>
        <section style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => copyToClipboard(serializedSelections)}>Copy</button>
            <button onClick={() => downloadText('EMV.Selections.lua', serializedSelections)}>Download</button>
          </div>
          <textarea readOnly value={serializedSelections} style={{ width: '100%', height: 200, fontFamily: 'monospace' }} />
        </section>
      </details>
    </div>
  )
}

function SelectionEditor({
  anchorId,
  selection,
  autoByIndex,
  onChangeAuto,
  onRenameSelection,
  onChangeOption,
  onAddOption,
  onRemoveOption,
  onMoveOption,
  onMoveAutoIndex,
}: {
  anchorId?: string
  selection: Selection
  autoByIndex: Map<number, AutoItem>
  onChangeAuto: (index: number, changes: Partial<AutoItem>) => void
  onRenameSelection: (newName: string) => void
  onChangeOption: (optIdx: number, changes: Partial<{ Name: string; Auto: number[] }>) => void
  onAddOption: () => void
  onRemoveOption: (optIdx: number) => void
  onMoveOption: (fromIdx: number, dir: 'up' | 'down') => void
  onMoveAutoIndex: (optIdx: number, indexPos: number, dir: 'up' | 'down') => void
}) {
  const [draftName, setDraftName] = useState(selection.Name)
  useEffect(() => {
    setDraftName(selection.Name)
  }, [selection.Name])
  return (
    <div id={anchorId} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input
          value={draftName}
          onChange={(e) => {
            const v = e.target.value
            setDraftName(v)
            const trimmed = v.trim()
            if (trimmed && trimmed.toLowerCase() !== 'none') {
              onRenameSelection(trimmed)
            }
          }}
          placeholder="New Group"
          autoFocus={draftName.trim() === ''}
          style={{ fontWeight: 600 }}
        />
        <button onClick={onAddOption}>Add Option</button>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {selection.Options.map((opt, optIdx) => (
          <div id={`${anchorId}-opt-${optIdx}`} key={optIdx} style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={opt.Name}
                onChange={(e) => onChangeOption(optIdx, { Name: e.target.value })}
                style={{ fontWeight: 500 }}
              />
              <button onClick={() => onMoveOption(optIdx, 'up')}>Move Up</button>
              <button onClick={() => onMoveOption(optIdx, 'down')}>Move Down</button>
              <button onClick={() => {
                if (confirm(`Remove option "${opt.Name}" from group "${selection.Name}"? This cannot be undone.`)) {
                  onRemoveOption(optIdx)
                }
              }}>Remove</button>
            </div>
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 500, margin: '4px 0' }}>
                Autolinked items{opt.Auto.length > 0 ? ` · ${opt.Auto.length}` : ''}
              </summary>
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {opt.Auto.length === 0 && <div style={{ color: '#666' }}>No linked Auto items</div>}
                {opt.Auto.map((idx, idxPos) => {
                  const item = autoByIndex.get(idx)
                  if (!item) return (
                    <div key={idx} style={{ color: 'red' }}>Missing Auto index {idx}</div>
                  )
                  return (
                    <AutoItemEditor
                      key={`${optIdx}-${idx}`}
                      item={item}
                      onChange={(ch) => onChangeAuto(idx, ch)}
                      compact
                    />
                  )
                })}
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
              <div style={{ width: '100%', borderTop: '1px dashed #ddd', margin: '12px 0' }} />
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
  compact,
  referenceCount,
}: {
  item: AutoItem
  onChange: (changes: Partial<AutoItem>) => void
  compact?: boolean
  referenceCount?: number
}) {
  const row = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 } as const
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 500 }}>#{item.index} – {item.ID}</div>
        <div style={{ fontSize: 12, color: referenceCount ? '#666' : '#b00020' }}>
          {referenceCount ? `Referenced in ${referenceCount} option${referenceCount === 1 ? '' : 's'}` : 'Warning: Not referenced in any selection'}
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
          <div style={row as any}>
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
          <div style={row as any}>
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
        <div style={row as any}>
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
