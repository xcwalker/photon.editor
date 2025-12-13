import { useEffect, useMemo, useState } from "react";
import Dropdown from "./Dropdown";
import { Toaster, toast } from "react-hot-toast";
import {
  type AutoItem,
  type ParsedEMV,
  type Selection,
  parseLuaForEMV,
  serializeEMVAuto,
  serializeEMVSelections,
  type PI,
  serializePI,
  serializeEMVLamps,
  serializeEMVSequences,
  serializeEMVLampsMeta,
} from "./luaParser";
import { removeAutoAndAdjust } from "./autoUtils";

import "./styles/styling.css";

function App() {
  const [luaText, setLuaText] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedEMV>({
    auto: [],
    selections: [],
    pi: { States: {} },
  });
  const [error, setError] = useState<string | null>(null);
  const [includeAutoUsageComments, setIncludeAutoUsageComments] =
    useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(false);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }>({ open: false });
  // Apply theme to html[data-theme]
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  // transient highlight management for validation quick-jumps
  useEffect(() => {
    const highlightTarget = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Capture the computed background color (shorthand 'background' won’t populate style.backgroundColor)
      const computed = window.getComputedStyle(el);
      const originalBg = computed.background;
      el.style.transition = "background-color 300ms ease";
      el.style.background = "rgba(255, 235, 59, 0.35)";
      setTimeout(() => {
        // Restore the computed original color to avoid ending up transparent
        el.style.background = originalBg;
      }, 900);
    };
    const onHashChange = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) highlightTarget(hash);
    };
    window.addEventListener("hashchange", onHashChange);
    // run once on mount if a hash is already present
    onHashChange();
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Parse Lua when input changes (avoid setState inside effects lint warning)
  const handleLuaChange = (text: string) => {
    setLuaText(text);
    try {
      const p = parseLuaForEMV(text);
      setParsed(p);
      setError(null);
    } catch (err) {
      const message =
        (err as { message?: string })?.message ?? "Failed to parse Lua";
      setError(message);
    }
  };

  // Example autoload removed: only load via button to keep empty input showing no selections

  const autoByIndex = useMemo(() => {
    const map = new Map<number, AutoItem>();
    parsed.auto.forEach((a) => map.set(a.index, a));
    return map;
  }, [parsed.auto]);

  const updateAutoItem = (index: number, changes: Partial<AutoItem>) => {
    setParsed((prev) => ({
      ...prev,
      auto: prev.auto.map((a) =>
        a.index === index ? { ...a, ...changes } : a
      ),
    }));
  };

  // Remove an Auto item and adjust all indices in autos and selections
  const removeAutoItem = (removeIndex: number) => {
    setParsed((prev) => removeAutoAndAdjust(prev, removeIndex));
  };

  const addAutoItem = () => {
    setParsed((prev) => {
      const nextIndex = prev.auto.length + 1;
      const newItem: AutoItem = {
        index: nextIndex,
        ID: "New Component",
        Scale: 1,
        Pos: { x: 0, y: 0, z: 0 },
        Ang: { p: 0, y: 0, r: 0 },
        Color1: "AMBER",
        Color2: "AMBER",
      };
      return { ...prev, auto: [...prev.auto, newItem] };
    });
  };

  // Create a new empty Auto item and link its index to a specific sub-group option
  const addLinkedAutoToOption = (selectionIdx: number, optionIdx: number) => {
    setParsed((prev) => {
      const nextIndex = prev.auto.length + 1;
      const newItem: AutoItem = {
        index: nextIndex,
        ID: "New Component",
        Scale: 1,
        Pos: { x: 0, y: 0, z: 0 },
        Ang: { p: 0, y: 0, r: 0 },
        Color1: "AMBER",
        Color2: "AMBER",
      };
      const newAuto = [...prev.auto, newItem];
      const newSelections = prev.selections.map((s, si) => {
        if (si !== selectionIdx) return s;
        return {
          ...s,
          Options: s.Options.map((o, oi) => {
            if (oi !== optionIdx) return o;
            return { ...o, Auto: [...o.Auto, nextIndex] };
          }),
        };
      });
      return { ...prev, auto: newAuto, selections: newSelections };
    });
  };

  // Duplicate an existing Auto item (by index) and append the duplicate at the end with a new index
  const duplicateAutoItem = (sourceIndex: number) => {
    setParsed((prev) => {
      const src = prev.auto.find((a) => a.index === sourceIndex);
      if (!src) return prev;
      const nextIndex = prev.auto.length + 1;
      const dup: AutoItem = {
        ...src,
        index: nextIndex,
      };
      toast.success(`Duplicated Auto #${sourceIndex} to #${nextIndex}`);
      // Navigate to the new item's anchor and let the hash-change highlighter kick in
      setTimeout(() => {
        window.location.hash = `auto-${nextIndex}`;
      }, 10);
      return { ...prev, auto: [...prev.auto, dup] };
    });
  };

  // Duplicate an Auto item and link the new index to a specific option within a selection
  const duplicateAutoAndLinkToOption = (
    sourceIndex: number,
    selectionIdx: number,
    optionIdx: number
  ) => {
    setParsed((prev) => {
      const src = prev.auto.find((a) => a.index === sourceIndex);
      if (!src) return prev;
      const nextIndex = prev.auto.length + 1;
      const dup: AutoItem = { ...src, index: nextIndex };
      const newAuto = [...prev.auto, dup];
      const newSelections = prev.selections.map((s, si) => {
        if (si !== selectionIdx) return s;
        return {
          ...s,
          Options: s.Options.map((o, oi) => {
            if (oi !== optionIdx) return o;
            return { ...o, Auto: [...o.Auto, nextIndex] };
          }),
        };
      });
      toast.success(`Duplicated Auto #${sourceIndex} and linked to option`);
      // Navigate to the new item's anchor inside the selection option
      const selAnchor = prev.selections[selectionIdx]?.Name?.trim()
        ? `sel-${prev.selections[selectionIdx].Name}`
        : `sel-${selectionIdx}`;
      setTimeout(() => {
        window.location.hash = `${selAnchor}-opt-${optionIdx}-auto-${nextIndex}`;
      }, 0);
      return { ...prev, auto: newAuto, selections: newSelections };
    });
  };

  // Unlink an existing Auto index from a specific option within a selection (no global reindex)
  const unlinkAutoFromOption = (
    selectionIdx: number,
    optionIdx: number,
    autoIndex: number
  ) => {
    setParsed((prev) => ({
      ...prev,
      selections: prev.selections.map((s, si) => {
        if (si !== selectionIdx) return s;
        return {
          ...s,
          Options: s.Options.map((o, oi) => {
            if (oi !== optionIdx) return o;
            return { ...o, Auto: o.Auto.filter((n) => n !== autoIndex) };
          }),
        };
      }),
    }));
  };

  const serializedAuto = useMemo(
    () =>
      serializeEMVAuto(
        parsed.auto,
        includeAutoUsageComments ? parsed.selections : undefined
      ),
    [parsed.auto, parsed.selections, includeAutoUsageComments]
  );
  const serializedSelections = useMemo(
    () => serializeEMVSelections(parsed.selections),
    [parsed.selections]
  );
  const serializedPI = useMemo(
    () => (parsed.pi ? serializePI(parsed.pi) : "PI.States = {}"),
    [parsed.pi]
  );
  const serializedLamps = useMemo(() => {
    if (parsed.lampsMeta && Object.keys(parsed.lampsMeta).length) {
      return serializeEMVLampsMeta(parsed.lampsMeta);
    }
    return parsed.lamps && parsed.lamps.length
      ? serializeEMVLamps(parsed.lamps)
      : "EMV.Lamps = {}";
  }, [parsed.lamps, parsed.lampsMeta]);
  const serializedSequences = useMemo(
    () =>
      parsed.sequences && parsed.sequences.length
        ? serializeEMVSequences(parsed.sequences)
        : "EMV.Sequences = {}",
    [parsed.sequences]
  );
  // Sync editable text with serialized outputs when parsed changes
  // No need to sync editable text for Sequences; using form-driven editor
  const serializedCombined = useMemo(() => {
    const parts: string[] = [];
    if (includeNotes) {
      const notes: string[] = [];
      notes.push("-- Photon Editor Notes");
      notes.push(`-- Auto items: ${parsed.auto.length}`);
      notes.push(`-- Selection groups: ${parsed.selections.length}`);
      const piStates = Object.keys(parsed.pi?.States ?? {}).length;
      const piPositions = parsed.pi?.Positions
        ? Object.keys(parsed.pi.Positions).length
        : 0;
      notes.push(`-- PI states: ${piStates}`);
      notes.push(`-- PI positions: ${piPositions}`);
      parts.push(notes.join("\n"));
    }
    if (serializedAuto.trim()) parts.push(serializedAuto.trim());
    if (serializedSelections.trim()) parts.push(serializedSelections.trim());
    if (serializedPI.trim()) parts.push(serializedPI.trim());
    if (serializedLamps.trim()) parts.push(serializedLamps.trim());
    if (serializedSequences.trim()) parts.push(serializedSequences.trim());
    return parts.join("\n\n");
  }, [
    serializedAuto,
    serializedSelections,
    serializedPI,
    serializedLamps,
    serializedSequences,
    includeNotes,
    parsed.auto.length,
    parsed.selections.length,
    parsed.pi,
  ]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success("Copied to clipboard");
    }
  };

  const downloadText = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const usageGroups = useMemo(() => {
    // Map selection name -> set of auto indices used anywhere in its options
    const map = new Map<string, Set<number>>();
    parsed.selections.forEach((sel) => {
      const set = map.get(sel.Name) ?? new Set<number>();
      sel.Options.forEach((opt) => opt.Auto.forEach((idx) => set.add(idx)));
      map.set(sel.Name, set);
    });
    // Convert to array with resolved items
    return Array.from(map.entries()).map(([name, set]) => ({
      name,
      indices: Array.from(set.values()).sort((a, b) => a - b),
    }));
  }, [parsed.selections]);

  const autoReferenceCounts = useMemo(() => {
    const counts = new Map<number, number>();
    parsed.selections.forEach((sel) => {
      sel.Options.forEach((opt) => {
        opt.Auto.forEach((idx) => counts.set(idx, (counts.get(idx) ?? 0) + 1));
      });
    });
    return counts;
  }, [parsed.selections]);

  const validationIssues = useMemo(() => {
    const issues: {
      selection: string;
      optionIndex: number;
      message: string;
      anchor?: string;
    }[] = [];
    // Prevent duplicate messages (same anchor, option index, and message)
    const seen = new Set<string>();
    // Detect duplicate group names (excluding empty names)
    const nameCounts = new Map<string, number>();
    parsed.selections.forEach((s) => {
      const n = s.Name.trim();
      if (n) nameCounts.set(n, (nameCounts.get(n) ?? 0) + 1);
    });
    parsed.selections.forEach((sel, si) => {
      const selAnchor = sel.Name.trim() ? `sel-${sel.Name}` : `sel-${si}`;
      // Group-level validation: warn when selection/group has no name
      if (!sel.Name.trim()) {
        const k = `${selAnchor}|-1|Group has no name`;
        if (!seen.has(k)) {
          issues.push({
            selection: sel.Name || "(unnamed)",
            optionIndex: -1,
            message: "Group has no name",
            anchor: selAnchor,
          });
          seen.add(k);
        }
      }
      // Warn if a group name is duplicated
      const trimmedName = sel.Name.trim();
      if (trimmedName && (nameCounts.get(trimmedName) ?? 0) > 1) {
        const k = `${selAnchor}|-1|Duplicate group name`;
        if (!seen.has(k)) {
          issues.push({
            selection: trimmedName,
            optionIndex: -1,
            message: "Duplicate group name",
            anchor: selAnchor,
          });
          seen.add(k);
        }
      }
      sel.Options.forEach((opt, oi) => {
        if (!opt.Name.trim()) {
          const k = `${selAnchor}|${oi}|Option has no name`;
          if (!seen.has(k)) {
            issues.push({
              selection: sel.Name || "(unnamed)",
              optionIndex: oi,
              message: "Option has no name",
              anchor: selAnchor,
            });
            seen.add(k);
          }
        }
        const isNone = opt.Name.trim().toLowerCase() === "none";
        if (opt.Auto.length === 0) {
          if (!isNone) {
            const msg =
              'Option has no Auto indices. Add an index or set the option name to "None".';
            const k = `${selAnchor}|${oi}|${msg}`;
            if (!seen.has(k)) {
              issues.push({
                selection: sel.Name || "(unnamed)",
                optionIndex: oi,
                message: msg,
                anchor: selAnchor,
              });
              seen.add(k);
            }
          }
        } else {
          const missing = opt.Auto.filter((n) => !autoByIndex.has(n));
          if (missing.length) {
            const msg = `Missing Auto indices: ${missing.join(", ")}`;
            const k = `${selAnchor}|${oi}|${msg}`;
            if (!seen.has(k)) {
              issues.push({
                selection: sel.Name || "(unnamed)",
                optionIndex: oi,
                message: msg,
                anchor: selAnchor,
              });
              seen.add(k);
            }
          }
        }
      });
    });
    // Add EMV.Auto items that are not referenced anywhere
    parsed.auto.forEach((a) => {
      const count = autoReferenceCounts.get(a.index) ?? 0;
      if (count === 0) {
        issues.push({
          selection: `Auto #${a.index} – ${a.ID}`,
          optionIndex: -1,
          message: "Auto item not referenced in any selection",
          anchor: `auto-${a.index}`,
        });
      }
    });
    return issues;
  }, [parsed.selections, parsed.auto, autoByIndex, autoReferenceCounts]);

  const issuesBySelection = useMemo(() => {
    const map = new Map<string, { count: number; messages: string[] }>();
    validationIssues.forEach((v) => {
      const entry = map.get(v.selection) ?? { count: 0, messages: [] };
      entry.count += 1;
      const label =
        v.optionIndex >= 0 ? `Option ${v.optionIndex + 1}` : "Group";
      entry.messages.push(`${label}: ${v.message}`);
      map.set(v.selection, entry);
    });
    return map;
  }, [validationIssues]);

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: 16,
        display: "grid",
        gap: 16,
        background: "var(--background)",
        color: "var(--text)",
      }}
    >
      <h1 style={{ margin: 0 }}>Photon EMV Editor</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 12, color: "var(--text-alt)" }}>Theme</label>
        <select
          value={theme}
          onChange={(e) =>
            setTheme(e.target.value as "system" | "light" | "dark")
          }
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
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
          <div style={{ display: "grid", gap: 6 }}>
            {validationIssues.map((v, i) => (
              <div key={`issue-${i}`}>
                <a
                  href={
                    v.anchor
                      ? `#${v.anchor}`
                      : v.optionIndex >= 0
                      ? `#sel-${encodeURIComponent(v.selection)}-opt-${
                          v.optionIndex
                        }`
                      : `#sel-${encodeURIComponent(v.selection)}`
                  }
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  {v.selection} ·{" "}
                  {v.optionIndex >= 0 ? `Option ${v.optionIndex + 1}` : "Group"}
                </a>
                : {v.message}
              </div>
            ))}
          </div>
        </WarningBox>
      )}

      <SectionWrapper title="Lua Source" defaultOpen>
        <section style={{ display: "grid", gap: 8 }}>
          <label htmlFor="luainput" style={{ fontWeight: 600 }}>
            Paste Lua
          </label>
          <TextArea
            id="luainput"
            placeholder="Paste your Lua here (containing EMV.Auto and EMV.Selections)"
            value={luaText}
            onChange={(e) => handleLuaChange(e.target.value)}
            monospaced
            style={{ height: 200, resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  const res = await fetch("/example.lua");
                  if (res.ok) {
                    const text = await res.text();
                    handleLuaChange(text);
                  }
                } catch (err) {
                  console.warn("Failed to load example.lua", err);
                }
              }}
            >
              Load example.lua
            </Button>
            <Button variant="danger" onClick={() => handleLuaChange("")}>
              Clear
            </Button>
          </div>
          {error && <div style={{ color: "red" }}>{error}</div>}
          <div style={{ fontSize: 12, color: "#666" }}>
            Parsed: {parsed.auto.length} Auto items · {parsed.selections.length}{" "}
            selections
          </div>
        </section>
      </SectionWrapper>

      <SectionWrapper title="EMV.Selections">
        <section style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="primary"
              onClick={() => {
                setParsed((prev) => ({
                  ...prev,
                  selections: [...prev.selections, { Name: "", Options: [] }],
                }));
                toast.success("Added group");
              }}
            >
              Add Group
            </Button>
          </div>
          {parsed.selections.map((sel, i) => (
            <div key={`sel-${i}`}>
              <details>
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 600,
                    position: "sticky",
                    top: 28,
                    background: "var(--primary)",
                    zIndex: 6,
                    padding: 8,
                    borderBottom: "1px solid var(--secondary)",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {(() => {
                      const itemCount = new Set<number>(
                        sel.Options.flatMap((o) => o.Auto)
                      ).size;
                      return (
                        <>
                          <span style={{ fontWeight: 700 }}>
                            {sel.Name || "(unnamed)"}
                          </span>{" "}
                          · {sel.Options.length} option
                          {sel.Options.length === 1 ? "" : "s"} · {itemCount}{" "}
                          item{itemCount === 1 ? "" : "s"}
                        </>
                      );
                    })()}
                    {sel.Name.trim() === "" && (
                      <span
                        style={{
                          marginLeft: 8,
                          color: "#b00020",
                          fontSize: 12,
                        }}
                      >
                        Name required
                      </span>
                    )}
                    {issuesBySelection.has(sel.Name) && (
                      <span
                        style={{
                          marginLeft: 8,
                          color: "#b00020",
                          fontSize: 12,
                        }}
                      >
                        {issuesBySelection.get(sel.Name)!.count} issue
                        {issuesBySelection.get(sel.Name)!.count === 1
                          ? ""
                          : "s"}
                      </span>
                    )}
                  </div>
                </summary>
                <div style={{ marginTop: 8 }}>
                  {sel.Name.trim() === "" && (
                    <WarningBox
                      title="Warning"
                      variant="error"
                      style={{ marginBottom: 8 }}
                    >
                      <div>
                        This group has no name. Please set a descriptive name.
                      </div>
                    </WarningBox>
                  )}
                  {issuesBySelection.has(sel.Name) && (
                    <WarningBox
                      title="Group Issues"
                      variant="error"
                      style={{ marginBottom: 8 }}
                    >
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {issuesBySelection
                          .get(sel.Name)!
                          .messages.map((msg, idx) => (
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
                    onAddLinkedAuto={(optIdx) =>
                      addLinkedAutoToOption(i, optIdx)
                    }
                    onUnlinkAuto={(optIdx, autoIdx) => {
                      unlinkAutoFromOption(i, optIdx, autoIdx);
                      toast.success(`Unlinked Auto #${autoIdx} from option`);
                    }}
                    onRenameSelection={(newName) => {
                      const trimmed = newName.trim();
                      // Prevent accidental blank or 'None' names overriding parsed names
                      if (!trimmed || trimmed.toLowerCase() === "none") return;
                      setParsed((prev) => ({
                        ...prev,
                        selections: prev.selections.map((s, si) =>
                          si === i ? { ...s, Name: trimmed } : s
                        ),
                      }));
                    }}
                    onChangeOption={(optIdx, changes) => {
                      setParsed((prev) => ({
                        ...prev,
                        selections: prev.selections.map((s, si) =>
                          si === i
                            ? {
                                ...s,
                                Options: s.Options.map((o, i2) =>
                                  i2 === optIdx ? { ...o, ...changes } : o
                                ),
                              }
                            : s
                        ),
                      }));
                    }}
                    onAddOption={() => {
                      setParsed((prev) => ({
                        ...prev,
                        selections: prev.selections.map((s, si) =>
                          si === i
                            ? {
                                ...s,
                                Options: [
                                  ...s.Options,
                                  { Name: "New Option", Auto: [] },
                                ],
                              }
                            : s
                        ),
                      }));
                      toast.success("Added option");
                    }}
                    onConfirmRemoveOption={(optIdx, optName, selName) => {
                      setConfirmState({
                        open: true,
                        title: "Remove Option",
                        message: `Remove option "${optName}" from group "${selName}"? This cannot be undone.`,
                        confirmText: "Remove",
                        cancelText: "Cancel",
                        onConfirm: () => {
                          setConfirmState({ open: false });
                          setParsed((prev) => ({
                            ...prev,
                            selections: prev.selections.map((s, si) =>
                              si === i
                                ? {
                                    ...s,
                                    Options: s.Options.filter(
                                      (_, i2) => i2 !== optIdx
                                    ),
                                  }
                                : s
                            ),
                          }));
                          toast.success("Option removed");
                        },
                      });
                    }}
                    onMoveOption={(fromIdx, dir) => {
                      setParsed((prev) => ({
                        ...prev,
                        selections: prev.selections.map((s, si) => {
                          if (si !== i) return s;
                          const toIdx = fromIdx + (dir === "up" ? -1 : 1);
                          if (toIdx < 0 || toIdx >= s.Options.length) return s;
                          const newOpts = [...s.Options];
                          const [item] = newOpts.splice(fromIdx, 1);
                          newOpts.splice(toIdx, 0, item);
                          return { ...s, Options: newOpts };
                        }),
                      }));
                    }}
                    onMoveAutoIndex={(optIdx, indexPos, dir) => {
                      setParsed((prev) => ({
                        ...prev,
                        selections: prev.selections.map((s, si) => {
                          if (si !== i) return s;
                          const opt = s.Options[optIdx];
                          if (!opt) return s;
                          const toPos = indexPos + (dir === "up" ? -1 : 1);
                          if (toPos < 0 || toPos >= opt.Auto.length) return s;
                          const newAuto = [...opt.Auto];
                          const [val] = newAuto.splice(indexPos, 1);
                          newAuto.splice(toPos, 0, val);
                          const newOpts = s.Options.map((o, i2) =>
                            i2 === optIdx ? { ...o, Auto: newAuto } : o
                          );
                          return { ...s, Options: newOpts };
                        }),
                      }));
                    }}
                    onConfirmRemoveAuto={(autoIdx, label) => {
                      setConfirmState({
                        open: true,
                        title: "Remove Auto",
                        message: `Remove Auto item ${label}? This will adjust indices in selections.`,
                        confirmText: "Remove",
                        cancelText: "Cancel",
                        onConfirm: () => {
                          setConfirmState({ open: false });
                          removeAutoItem(autoIdx);
                          toast.success(`Removed Auto ${label}`);
                        },
                      });
                    }}
                    onDuplicateAuto={(optIdx, autoIdx) =>
                      duplicateAutoAndLinkToOption(autoIdx, i, optIdx)
                    }
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 8,
                    }}
                  >
                    <Button
                      variant="danger"
                      onClick={() => {
                        setConfirmState({
                          open: true,
                          title: "Remove Group",
                          message: `Remove group "${sel.Name}"? This cannot be undone.`,
                          confirmText: "Remove",
                          cancelText: "Cancel",
                          onConfirm: () => {
                            setConfirmState({ open: false });
                            setParsed((prev) => ({
                              ...prev,
                              selections: prev.selections.filter(
                                (_, si) => si !== i
                              ),
                            }));
                            toast.success("Group removed");
                          },
                        });
                      }}
                    >
                      Remove Group
                    </Button>
                  </div>
                </div>
              </details>
            </div>
          ))}
        </section>
      </SectionWrapper>

      <SectionWrapper title="Auto Usage by Selection">
        <section style={{ display: "grid", gap: 12 }}>
          {usageGroups.map((group) => (
            <div
              key={group.name}
              style={{
                border: "1px solid var(--secondary)",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {group.name}
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
                }}
              >
                {group.indices.length === 0 && (
                  <div style={{ color: "#666" }}>No Auto items referenced</div>
                )}
                {group.indices.map((idx) => {
                  const item = autoByIndex.get(idx);
                  return item ? (
                    <AutoItemEditor
                      key={`${group.name}-${idx}`}
                      item={item}
                      onChange={(ch) => updateAutoItem(idx, ch)}
                      compact
                      referenceCount={autoReferenceCounts.get(idx) ?? 0}
                    />
                  ) : (
                    <div
                      key={`${group.name}-missing-${idx}`}
                      style={{ color: "red" }}
                    >
                      Missing Auto index {idx}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </SectionWrapper>

      <SectionWrapper title="EMV.Auto">
        <section style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button variant="primary" onClick={addAutoItem}>
              Add Item
            </Button>
          </div>
          <div
            style={{
              display: "grid",
              gap: 8,
              gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
            }}
          >
            {parsed.auto.map((a) => (
              <AutoItemEditor
                key={a.index}
                anchorId={`auto-${a.index}`}
                item={a}
                onChange={(ch) => updateAutoItem(a.index, ch)}
                onConfirmRemove={() => {
                  setConfirmState({
                    open: true,
                    title: "Remove Auto",
                    message: `Remove Auto item #${a.index} – ${a.ID}? This will adjust indices in selections.`,
                    confirmText: "Remove",
                    cancelText: "Cancel",
                    onConfirm: () => {
                      setConfirmState({ open: false });
                      removeAutoItem(a.index);
                      toast.success(`Removed Auto #${a.index}`);
                    },
                  });
                }}
                onDuplicate={() => duplicateAutoItem(a.index)}
                referenceCount={autoReferenceCounts.get(a.index) ?? 0}
              />
            ))}
          </div>
        </section>
      </SectionWrapper>

      <SectionWrapper title="PI.States">
        <section style={{ display: "grid", gap: 12 }}>
          <PIStatesEditor
            pi={parsed.pi ?? { States: {} }}
            onChange={(next) => setParsed((prev) => ({ ...prev, pi: next }))}
          />
        </section>
      </SectionWrapper>

      <SectionWrapper title="PI.Meta">
        <section style={{ display: "grid", gap: 12 }}>
          <PIMetaEditor
            meta={parsed.pi?.Meta ?? {}}
            onChange={(next) =>
              setParsed((prev) => ({
                ...prev,
                pi: { ...(prev.pi ?? { States: {} }), Meta: next },
              }))
            }
          />
        </section>
      </SectionWrapper>

      <SectionWrapper title="PI.Positions">
        <section style={{ display: "grid", gap: 12 }}>
          {!parsed.pi?.Positions ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Button
                variant="primary"
                onClick={() =>
                  setParsed((prev) => ({
                    ...prev,
                    pi: { ...(prev.pi ?? { States: {} }), Positions: {} },
                  }))
                }
              >
                Initialize Positions
              </Button>
              <span style={{ fontSize: 12, color: "var(--text-alt)" }}>
                No PI.Positions parsed. Initialize an empty set to start adding
                entries.
              </span>
            </div>
          ) : (
            <PIPositionsEditor
              positions={parsed.pi.Positions}
              onChange={(next) =>
                setParsed((prev) => ({
                  ...prev,
                  pi: { ...(prev.pi ?? { States: {} }), Positions: next },
                }))
              }
            />
          )}
        </section>
      </SectionWrapper>

      {/* Dedicated Lamps edit panel */}
      <SectionWrapper title="EMV.Lamps" defaultOpen>
        <section style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, color: "var(--text-alt)" }}>
              {parsed.lampsMeta && Object.keys(parsed.lampsMeta).length
                ? `Dictionary LampsMeta entries: ${
                    Object.keys(parsed.lampsMeta).length
                  }`
                : `Array Lamps entries: ${parsed.lamps?.length ?? 0}`}
            </div>
            <span
              style={{ marginLeft: 8, fontSize: 12, color: "var(--text-alt)" }}
            >
              Output prefers LampsMeta when available
            </span>
          </div>
          {/* Editable, form-driven Lamps editor (no textarea) */}
          {parsed.lampsMeta && Object.keys(parsed.lampsMeta).length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {Object.entries(parsed.lampsMeta).map(([name, entry]) => (
                <div
                  key={`lampmeta-${name}`}
                  style={{
                    border: "1px solid var(--secondary)",
                    borderRadius: 8,
                    padding: 12,
                    background: "var(--background)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{name}</div>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setParsed((prev) => {
                          const next = { ...(prev.lampsMeta ?? {}) };
                          delete next[name];
                          return { ...prev, lampsMeta: next };
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 12, color: "var(--text-alt)" }}>
                        Color (RGBA)
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Input
                          type="number"
                          value={entry.Color?.r ?? ""}
                          placeholder="r"
                          onChange={(e) => {
                            const r = parseFloat(e.target.value);
                            setParsed((prev) => {
                              const next = { ...(prev.lampsMeta ?? {}) };
                              const old = next[name] ?? {};
                              const c = old.Color ?? { r: 255, g: 255, b: 255 };
                              next[name] = {
                                ...old,
                                Color: { ...c, r: Number.isNaN(r) ? c.r : r },
                              };
                              return { ...prev, lampsMeta: next };
                            });
                          }}
                        />
                        <Input
                          type="number"
                          value={entry.Color?.g ?? ""}
                          placeholder="g"
                          onChange={(e) => {
                            const g = parseFloat(e.target.value);
                            setParsed((prev) => {
                              const next = { ...(prev.lampsMeta ?? {}) };
                              const old = next[name] ?? {};
                              const c = old.Color ?? { r: 255, g: 255, b: 255 };
                              next[name] = {
                                ...old,
                                Color: { ...c, g: Number.isNaN(g) ? c.g : g },
                              };
                              return { ...prev, lampsMeta: next };
                            });
                          }}
                        />
                        <Input
                          type="number"
                          value={entry.Color?.b ?? ""}
                          placeholder="b"
                          onChange={(e) => {
                            const b = parseFloat(e.target.value);
                            setParsed((prev) => {
                              const next = { ...(prev.lampsMeta ?? {}) };
                              const old = next[name] ?? {};
                              const c = old.Color ?? { r: 255, g: 255, b: 255 };
                              next[name] = {
                                ...old,
                                Color: { ...c, b: Number.isNaN(b) ? c.b : b },
                              };
                              return { ...prev, lampsMeta: next };
                            });
                          }}
                        />
                        <Input
                          type="number"
                          value={entry.Color?.a ?? ""}
                          placeholder="a"
                          onChange={(e) => {
                            const a = parseFloat(e.target.value);
                            setParsed((prev) => {
                              const next = { ...(prev.lampsMeta ?? {}) };
                              const old = next[name] ?? {};
                              const c = old.Color ?? { r: 255, g: 255, b: 255 };
                              next[name] = {
                                ...old,
                                Color: { ...c, a: Number.isNaN(a) ? c.a : a },
                              };
                              return { ...prev, lampsMeta: next };
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 12, color: "var(--text-alt)" }}>
                        Texture
                      </div>
                      <Input
                        value={entry.Texture ?? ""}
                        placeholder="sprites/emv/..."
                        onChange={(e) => {
                          const v = e.target.value;
                          setParsed((prev) => {
                            const next = { ...(prev.lampsMeta ?? {}) };
                            const old = next[name] ?? {};
                            next[name] = { ...old, Texture: v };
                            return { ...prev, lampsMeta: next };
                          });
                        }}
                      />
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 12, color: "var(--text-alt)" }}>
                        Near
                      </div>
                      <Input
                        type="number"
                        value={entry.Near ?? ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setParsed((prev) => {
                            const next = { ...(prev.lampsMeta ?? {}) };
                            const old = next[name] ?? {};
                            next[name] = {
                              ...old,
                              Near: Number.isNaN(v) ? old.Near : v,
                            };
                            return { ...prev, lampsMeta: next };
                          });
                        }}
                      />
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 12, color: "var(--text-alt)" }}>
                        FOV
                      </div>
                      <Input
                        type="number"
                        value={entry.FOV ?? ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setParsed((prev) => {
                            const next = { ...(prev.lampsMeta ?? {}) };
                            const old = next[name] ?? {};
                            next[name] = {
                              ...old,
                              FOV: Number.isNaN(v) ? old.FOV : v,
                            };
                            return { ...prev, lampsMeta: next };
                          });
                        }}
                      />
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 12, color: "var(--text-alt)" }}>
                        Distance
                      </div>
                      <Input
                        type="number"
                        value={entry.Distance ?? ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setParsed((prev) => {
                            const next = { ...(prev.lampsMeta ?? {}) };
                            const old = next[name] ?? {};
                            next[name] = {
                              ...old,
                              Distance: Number.isNaN(v) ? old.Distance : v,
                            };
                            return { ...prev, lampsMeta: next };
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div>
                <Button
                  variant="primary"
                  onClick={() => {
                    const newName = `Lamp${
                      (Object.keys(parsed.lampsMeta ?? {}).length || 0) + 1
                    }`;
                    setParsed((prev) => ({
                      ...prev,
                      lampsMeta: {
                        ...(prev.lampsMeta ?? {}),
                        [newName]: { Color: { r: 255, g: 255, b: 255, a: 1 } },
                      },
                    }));
                    toast.success(`Added ${newName}`);
                  }}
                >
                  Add Lamp
                </Button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(serializedLamps)}
                >
                  Copy Lamps
                </Button>
                <Button
                  variant="primary"
                  onClick={() => downloadText("EMV.Lamps.lua", serializedLamps)}
                >
                  Download Lamps
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {(parsed.lamps ?? []).map((l, idx) => (
                <div
                  key={`lamparr-${idx}`}
                  style={{
                    border: "1px solid var(--secondary)",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gap: 8,
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(280px, 1fr))",
                    }}
                  >
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 12, color: "var(--text-alt)" }}>
                        ID
                      </div>
                      <Input
                        value={l.ID ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setParsed((prev) => ({
                            ...prev,
                            lamps: (prev.lamps ?? []).map((it, i2) =>
                              i2 === idx ? { ...it, ID: v } : it
                            ),
                          }));
                        }}
                      />
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 12, color: "var(--text-alt)" }}>
                        Color
                      </div>
                      <Input
                        value={l.Color ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setParsed((prev) => ({
                            ...prev,
                            lamps: (prev.lamps ?? []).map((it, i2) =>
                              i2 === idx ? { ...it, Color: v } : it
                            ),
                          }));
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    <Button
                      variant="danger"
                      onClick={() => {
                        setParsed((prev) => ({
                          ...prev,
                          lamps: (prev.lamps ?? []).filter(
                            (_, i2) => i2 !== idx
                          ),
                        }));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <div>
                <Button
                  variant="primary"
                  onClick={() => {
                    setParsed((prev) => {
                      const nextIndex = (prev.lamps?.length ?? 0) + 1;
                      const nextLamp = {
                        index: nextIndex,
                        ID: "New Lamp",
                        Color: "WHITE",
                      };
                      return {
                        ...prev,
                        lamps: [
                          ...(prev.lamps ?? []),
                          nextLamp as typeof prev.lamps extends Array<infer T>
                            ? T
                            : never,
                        ],
                      };
                    });
                    toast.success("Added Lamp");
                  }}
                >
                  Add Lamp
                </Button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(serializedLamps)}
                >
                  Copy Lamps
                </Button>
                <Button
                  variant="primary"
                  onClick={() => downloadText("EMV.Lamps.lua", serializedLamps)}
                >
                  Download Lamps
                </Button>
              </div>
            </div>
          )}
        </section>
      </SectionWrapper>

      {/* Dedicated Sequences edit panel */}
      <SectionWrapper title="EMV.Sequences" defaultOpen>
        <section style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, color: "var(--text-alt)" }}>
              Total sequences parsed: {parsed.sequences?.length ?? 0}
            </div>
            <span
              style={{ marginLeft: 8, fontSize: 12, color: "var(--text-alt)" }}
            >
              Groups: Sequences, Traffic, Illumination
            </span>
          </div>

          {/* Form-driven editor for EMV.Sequences (no textarea) */}
          <div style={{ display: "grid", gap: 12 }}>
            {(parsed.sequences ?? []).map((s, idx) => (
              <div
                key={`seq-${idx}`}
                style={{
                  border: "1px solid var(--secondary)",
                  borderRadius: 8,
                  padding: 12,
                  background: "var(--background)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 12, color: "var(--text-alt)" }}>
                      Name
                    </div>
                    <Input
                      value={s.Name ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setParsed((prev) => ({
                          ...prev,
                          sequences: (prev.sequences ?? []).map((it, i2) =>
                            i2 === idx ? { ...it, Name: v } : it
                          ),
                        }));
                      }}
                    />
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 12, color: "var(--text-alt)" }}>
                      Stage
                    </div>
                    <Input
                      value={(s.Stage ?? "") as string}
                      onChange={(e) => {
                        const v = e.target.value;
                        setParsed((prev) => ({
                          ...prev,
                          sequences: (prev.sequences ?? []).map((it, i2) =>
                            i2 === idx ? { ...it, Stage: v } : it
                          ),
                        }));
                      }}
                    />
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 12, color: "var(--text-alt)" }}>
                      Group
                    </div>
                    <Dropdown
                      value={s.Group ?? "Sequences"}
                      options={[
                        { value: "Sequences", label: "Sequences" },
                        { value: "Traffic", label: "Traffic" },
                        { value: "Illumination", label: "Illumination" },
                      ]}
                      onChange={(v) => {
                        const group = v as
                          | "Sequences"
                          | "Traffic"
                          | "Illumination";
                        setParsed((prev) => ({
                          ...prev,
                          sequences: (prev.sequences ?? []).map((it, i2) =>
                            i2 === idx ? { ...it, Group: group } : it
                          ),
                        }));
                      }}
                      width={200}
                    />
                  </div>
                </div>

                {/* Components editor: supports dict/array/illumination section */}
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 500 }}>
                    Components
                  </summary>
                  {/* Dict components */}
                  {!Array.isArray(s.Components) && s.Components ? (
                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      {Object.entries(
                        s.Components as unknown as Record<string, string>
                      ).map(([k, v]) => (
                        <div
                          key={`comp-d-${idx}-${k}`}
                          style={{
                            display: "grid",
                            gap: 6,
                            gridTemplateColumns: "1fr 1fr auto",
                          }}
                        >
                          <Input
                            value={k}
                            onChange={(e) => {
                              const newKey = e.target.value;
                              setParsed((prev) => {
                                const seqs = [...(prev.sequences ?? [])];
                                const cur = seqs[idx];
                                const dict = {
                                  ...(cur.Components as Record<string, string>),
                                };
                                delete dict[k];
                                dict[newKey] = String(v);
                                seqs[idx] = { ...cur, Components: dict };
                                return { ...prev, sequences: seqs };
                              });
                            }}
                          />
                          <Input
                            value={String(v)}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setParsed((prev) => {
                                const seqs = [...(prev.sequences ?? [])];
                                const cur = seqs[idx];
                                const dict = {
                                  ...(cur.Components as Record<string, string>),
                                };
                                dict[k] = newVal;
                                seqs[idx] = { ...cur, Components: dict };
                                return { ...prev, sequences: seqs };
                              });
                            }}
                          />
                          <Button
                            variant="danger"
                            onClick={() => {
                              setParsed((prev) => {
                                const seqs = [...(prev.sequences ?? [])];
                                const cur = seqs[idx];
                                const dict = {
                                  ...(cur.Components as Record<string, string>),
                                };
                                delete dict[k];
                                seqs[idx] = { ...cur, Components: dict };
                                return { ...prev, sequences: seqs };
                              });
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="primary"
                        onClick={() => {
                          setParsed((prev) => {
                            const seqs = [...(prev.sequences ?? [])];
                            const cur = seqs[idx];
                            const dict = {
                              ...((cur.Components as Record<string, string>) ||
                                {}),
                            };
                            const base = "Comp";
                            let n = 1;
                            while (dict[`${base}${n}`]) n++;
                            dict[`${base}${n}`] = "AUTO";
                            seqs[idx] = { ...cur, Components: dict };
                            return { ...prev, sequences: seqs };
                          });
                        }}
                      >
                        Add Component
                      </Button>
                    </div>
                  ) : Array.isArray(s.Components) && s.Components ? (
                    // Array components
                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      {((s.Components as unknown as number[]) ?? []).map(
                        (val, i2) => (
                          <div
                            key={`comp-a-${idx}-${i2}`}
                            style={{
                              display: "grid",
                              gap: 6,
                              gridTemplateColumns: "1fr auto",
                            }}
                          >
                            <Input
                              value={String(val)}
                              onChange={(e) => {
                                const newValNum = parseFloat(e.target.value);
                                setParsed((prev) => {
                                  const seqs = [...(prev.sequences ?? [])];
                                  const cur = seqs[idx];
                                  const arr = [
                                    ...((cur.Components as unknown as number[]) ??
                                      []),
                                  ];
                                  arr[i2] = Number.isNaN(newValNum)
                                    ? arr[i2]
                                    : newValNum;
                                  seqs[idx] = { ...cur, Components: arr };
                                  return { ...prev, sequences: seqs };
                                });
                              }}
                            />
                            <Button
                              variant="danger"
                              onClick={() => {
                                setParsed((prev) => {
                                  const seqs = [...(prev.sequences ?? [])];
                                  const cur = seqs[idx];
                                  const arr = [
                                    ...((cur.Components as unknown as number[]) ??
                                      []),
                                  ];
                                  arr.splice(i2, 1);
                                  seqs[idx] = { ...cur, Components: arr };
                                  return { ...prev, sequences: seqs };
                                });
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        )
                      )}
                      <Button
                        variant="primary"
                        onClick={() => {
                          setParsed((prev) => {
                            const seqs = [...(prev.sequences ?? [])];
                            const cur = seqs[idx];
                            const arr = [
                              ...((cur.Components as unknown as number[]) ??
                                []),
                            ];
                            arr.push(1);
                            seqs[idx] = { ...cur, Components: arr };
                            return { ...prev, sequences: seqs };
                          });
                        }}
                      >
                        Add Component
                      </Button>
                    </div>
                  ) : s.Group === "Illumination" ? (
                    // Illumination section-style components: { {index, color, value} }
                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      {(
                        (s.Components as unknown as Array<{
                          index: number;
                          color: string;
                          value: number;
                        }>) ?? []
                      ).map((e, i2) => (
                        <div
                          key={`comp-i-${idx}-${i2}`}
                          style={{
                            display: "grid",
                            gap: 6,
                            gridTemplateColumns: "repeat(3, 1fr) auto",
                          }}
                        >
                          <Input
                            type="number"
                            value={e.index ?? ""}
                            placeholder="index"
                            onChange={(ev) => {
                              const nv = parseInt(ev.target.value, 10);
                              setParsed((prev) => {
                                const seqs = [...(prev.sequences ?? [])];
                                const cur = seqs[idx];
                                const arr = [
                                  ...((cur.Components as unknown as Array<{
                                    index: number;
                                    color: string;
                                    value: number;
                                  }>) ?? []),
                                ];
                                arr[i2] = {
                                  ...arr[i2],
                                  index: Number.isNaN(nv) ? arr[i2].index : nv,
                                };
                                seqs[idx] = { ...cur, Components: arr };
                                return { ...prev, sequences: seqs };
                              });
                            }}
                          />
                          <Input
                            value={e.color ?? ""}
                            placeholder="color"
                            onChange={(ev) => {
                              const nv = ev.target.value;
                              setParsed((prev) => {
                                const seqs = [...(prev.sequences ?? [])];
                                const cur = seqs[idx];
                                const arr = [
                                  ...((cur.Components as unknown as Array<{
                                    index: number;
                                    color: string;
                                    value: number;
                                  }>) ?? []),
                                ];
                                arr[i2] = { ...arr[i2], color: nv };
                                seqs[idx] = { ...cur, Components: arr };
                                return { ...prev, sequences: seqs };
                              });
                            }}
                          />
                          <Input
                            type="number"
                            value={e.value ?? ""}
                            placeholder="value"
                            onChange={(ev) => {
                              const nv = parseFloat(ev.target.value);
                              setParsed((prev) => {
                                const seqs = [...(prev.sequences ?? [])];
                                const cur = seqs[idx];
                                const arr = [
                                  ...((cur.Components as unknown as Array<{
                                    index: number;
                                    color: string;
                                    value: number;
                                  }>) ?? []),
                                ];
                                arr[i2] = {
                                  ...arr[i2],
                                  value: Number.isNaN(nv) ? arr[i2].value : nv,
                                };
                                seqs[idx] = { ...cur, Components: arr };
                                return { ...prev, sequences: seqs };
                              });
                            }}
                          />
                          <Button
                            variant="danger"
                            onClick={() => {
                              setParsed((prev) => {
                                const seqs = [...(prev.sequences ?? [])];
                                const cur = seqs[idx];
                                const arr = [
                                  ...((cur.Components as unknown as Array<{
                                    index: number;
                                    color: string;
                                    value: number;
                                  }>) ?? []),
                                ];
                                arr.splice(i2, 1);
                                seqs[idx] = { ...cur, Components: arr };
                                return { ...prev, sequences: seqs };
                              });
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="primary"
                        onClick={() => {
                          setParsed((prev) => {
                            const seqs = [...(prev.sequences ?? [])];
                            const cur = seqs[idx];
                            const arr = [
                              ...((cur.Components as unknown as Array<{
                                index: number;
                                color: string;
                                value: number;
                              }>) ?? []),
                            ];
                            arr.push({ index: 1, color: "WHITE", value: 1 });
                            seqs[idx] = { ...cur, Components: arr };
                            return { ...prev, sequences: seqs };
                          });
                        }}
                      >
                        Add Component
                      </Button>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-alt)",
                        marginTop: 8,
                      }}
                    >
                      No Components
                    </div>
                  )}
                </details>

                {/* Lights editor (Illumination only) */}
                {s.Group === "Illumination" && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ cursor: "pointer", fontWeight: 500 }}>
                      Lights
                    </summary>
                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      {(s.Lights ?? []).map((l, i2) => (
                        <div
                          key={`light-${idx}-${i2}`}
                          style={{
                            border: "1px solid var(--secondary)",
                            borderRadius: 8,
                            padding: 10,
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gap: 6,
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(220px, 1fr))",
                            }}
                          >
                            <Input
                              value={l.name ?? ""}
                              placeholder="name"
                              onChange={(e) => {
                                const nv = e.target.value;
                                setParsed((prev) => {
                                  const seqs = [...(prev.sequences ?? [])];
                                  const cur = seqs[idx];
                                  const lights = [...(cur.Lights ?? [])];
                                  lights[i2] = { ...lights[i2], name: nv };
                                  seqs[idx] = { ...cur, Lights: lights };
                                  return { ...prev, sequences: seqs };
                                });
                              }}
                            />
                            {/* Position */}
                            <Input
                              type="number"
                              value={l.pos?.x ?? ""}
                              placeholder="pos.x"
                              onChange={(e) => {
                                const nv = parseFloat(e.target.value);
                                setParsed((prev) => {
                                  const seqs = [...(prev.sequences ?? [])];
                                  const cur = seqs[idx];
                                  const lights = [...(cur.Lights ?? [])];
                                  const p = lights[i2]?.pos ?? {
                                    x: 0,
                                    y: 0,
                                    z: 0,
                                  };
                                  lights[i2] = {
                                    ...lights[i2],
                                    pos: {
                                      ...p,
                                      x: Number.isNaN(nv) ? p.x : nv,
                                    },
                                  };
                                  seqs[idx] = { ...cur, Lights: lights };
                                  return { ...prev, sequences: seqs };
                                });
                              }}
                            />
                            <Input
                              type="number"
                              value={l.pos?.y ?? ""}
                              placeholder="pos.y"
                              onChange={(e) => {
                                const nv = parseFloat(e.target.value);
                                setParsed((prev) => {
                                  const seqs = [...(prev.sequences ?? [])];
                                  const cur = seqs[idx];
                                  const lights = [...(cur.Lights ?? [])];
                                  const p = lights[i2]?.pos ?? {
                                    x: 0,
                                    y: 0,
                                    z: 0,
                                  };
                                  lights[i2] = {
                                    ...lights[i2],
                                    pos: {
                                      ...p,
                                      y: Number.isNaN(nv) ? p.y : nv,
                                    },
                                  };
                                  seqs[idx] = { ...cur, Lights: lights };
                                  return { ...prev, sequences: seqs };
                                });
                              }}
                            />
                            <Input
                              type="number"
                              value={l.pos?.z ?? ""}
                              placeholder="pos.z"
                              onChange={(e) => {
                                const nv = parseFloat(e.target.value);
                                setParsed((prev) => {
                                  const seqs = [...(prev.sequences ?? [])];
                                  const cur = seqs[idx];
                                  const lights = [...(cur.Lights ?? [])];
                                  const p = lights[i2]?.pos ?? {
                                    x: 0,
                                    y: 0,
                                    z: 0,
                                  };
                                  lights[i2] = {
                                    ...lights[i2],
                                    pos: {
                                      ...p,
                                      z: Number.isNaN(nv) ? p.z : nv,
                                    },
                                  };
                                  seqs[idx] = { ...cur, Lights: lights };
                                  return { ...prev, sequences: seqs };
                                });
                              }}
                            />
                            {/* Angle */}
                            <Input
                              type="number"
                              value={l.ang?.p ?? ""}
                              placeholder="ang.p"
                              onChange={(e) => {
                                const nv = parseFloat(e.target.value);
                                setParsed((prev) => {
                                  const seqs = [...(prev.sequences ?? [])];
                                  const cur = seqs[idx];
                                  const lights = [...(cur.Lights ?? [])];
                                  const a = lights[i2]?.ang ?? {
                                    p: 0,
                                    y: 0,
                                    r: 0,
                                  };
                                  lights[i2] = {
                                    ...lights[i2],
                                    ang: {
                                      ...a,
                                      p: Number.isNaN(nv) ? a.p : nv,
                                    },
                                  };
                                  seqs[idx] = { ...cur, Lights: lights };
                                  return { ...prev, sequences: seqs };
                                });
                              }}
                            />
                            <Input
                              type="number"
                              value={l.ang?.y ?? ""}
                              placeholder="ang.y"
                              onChange={(e) => {
                                const nv = parseFloat(e.target.value);
                                setParsed((prev) => {
                                  const seqs = [...(prev.sequences ?? [])];
                                  const cur = seqs[idx];
                                  const lights = [...(cur.Lights ?? [])];
                                  const a = lights[i2]?.ang ?? {
                                    p: 0,
                                    y: 0,
                                    r: 0,
                                  };
                                  lights[i2] = {
                                    ...lights[i2],
                                    ang: {
                                      ...a,
                                      y: Number.isNaN(nv) ? a.y : nv,
                                    },
                                  };
                                  seqs[idx] = { ...cur, Lights: lights };
                                  return { ...prev, sequences: seqs };
                                });
                              }}
                            />
                            <Input
                              type="number"
                              value={l.ang?.r ?? ""}
                              placeholder="ang.r"
                              onChange={(e) => {
                                const nv = parseFloat(e.target.value);
                                setParsed((prev) => {
                                  const seqs = [...(prev.sequences ?? [])];
                                  const cur = seqs[idx];
                                  const lights = [...(cur.Lights ?? [])];
                                  const a = lights[i2]?.ang ?? {
                                    p: 0,
                                    y: 0,
                                    r: 0,
                                  };
                                  lights[i2] = {
                                    ...lights[i2],
                                    ang: {
                                      ...a,
                                      r: Number.isNaN(nv) ? a.r : nv,
                                    },
                                  };
                                  seqs[idx] = { ...cur, Lights: lights };
                                  return { ...prev, sequences: seqs };
                                });
                              }}
                            />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              marginTop: 8,
                            }}
                          >
                            <Button
                              variant="danger"
                              onClick={() => {
                                setParsed((prev) => {
                                  const seqs = [...(prev.sequences ?? [])];
                                  const cur = seqs[idx];
                                  const lights = [...(cur.Lights ?? [])];
                                  lights.splice(i2, 1);
                                  seqs[idx] = { ...cur, Lights: lights };
                                  return { ...prev, sequences: seqs };
                                });
                              }}
                            >
                              Remove Light
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="primary"
                        onClick={() => {
                          setParsed((prev) => {
                            const seqs = [...(prev.sequences ?? [])];
                            const cur = seqs[idx];
                            const lights = [...(cur.Lights ?? [])];
                            lights.push({
                              pos: { x: 0, y: 0, z: 0 },
                              ang: { p: 0, y: 0, r: 0 },
                              name: "light",
                            });
                            seqs[idx] = { ...cur, Lights: lights };
                            return { ...prev, sequences: seqs };
                          });
                        }}
                      >
                        Add Light
                      </Button>
                    </div>
                  </details>
                )}

                {/* Disconnect list */}
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 500 }}>
                    Disconnect
                  </summary>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {(s.Disconnect ?? []).map((v, i2) => (
                      <div
                        key={`disc-${idx}-${i2}`}
                        style={{
                          display: "grid",
                          gap: 6,
                          gridTemplateColumns: "1fr auto",
                        }}
                      >
                        <Input
                          type="number"
                          value={v}
                          onChange={(e) => {
                            const nv = parseInt(e.target.value, 10);
                            setParsed((prev) => {
                              const seqs = [...(prev.sequences ?? [])];
                              const cur = seqs[idx];
                              const d = [...(cur.Disconnect ?? [])];
                              d[i2] = Number.isNaN(nv) ? d[i2] : nv;
                              seqs[idx] = { ...cur, Disconnect: d };
                              return { ...prev, sequences: seqs };
                            });
                          }}
                        />
                        <Button
                          variant="danger"
                          onClick={() => {
                            setParsed((prev) => {
                              const seqs = [...(prev.sequences ?? [])];
                              const cur = seqs[idx];
                              const d = [...(cur.Disconnect ?? [])];
                              d.splice(i2, 1);
                              seqs[idx] = { ...cur, Disconnect: d };
                              return { ...prev, sequences: seqs };
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="primary"
                      onClick={() => {
                        setParsed((prev) => {
                          const seqs = [...(prev.sequences ?? [])];
                          const cur = seqs[idx];
                          const d = [...(cur.Disconnect ?? [])];
                          d.push(1);
                          seqs[idx] = { ...cur, Disconnect: d };
                          return { ...prev, sequences: seqs };
                        });
                      }}
                    >
                      Add Disconnect
                    </Button>
                  </div>
                </details>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 8,
                    gap: 8,
                  }}
                >
                  <Button
                    variant="danger"
                    onClick={() => {
                      setParsed((prev) => ({
                        ...prev,
                        sequences: (prev.sequences ?? []).filter(
                          (_, i2) => i2 !== idx
                        ),
                      }));
                    }}
                  >
                    Remove Sequence
                  </Button>
                </div>
              </div>
            ))}
            <div>
              <Button
                variant="primary"
                onClick={() => {
                  setParsed((prev) => ({
                    ...prev,
                    sequences: [
                      ...(prev.sequences ?? []),
                      {
                        Name: "New Sequence",
                        Stage: "M1",
                        Group: "Sequences",
                        Components: {},
                        Disconnect: [],
                      },
                    ],
                  }));
                  toast.success("Added Sequence");
                }}
              >
                Add Sequence
              </Button>
            </div>
          </div>

          {/* Export actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button
              variant="secondary"
              onClick={() => copyToClipboard(serializedSequences)}
            >
              Copy Sequences
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                downloadText("EMV.Sequences.lua", serializedSequences)
              }
            >
              Download Sequences
            </Button>
          </div>
        </section>
      </SectionWrapper>

      {/* Consolidated output section at the bottom */}
      <SectionWrapper title="Lua Output" defaultOpen>
        <section style={{ display: "grid", gap: 12 }}>
          {/* Combined output */}
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(serializedCombined)}
              >
                Copy Combined
              </Button>
              <Button
                variant="primary"
                onClick={() => downloadText("Photon.lua", serializedCombined)}
              >
                Download Combined
              </Button>
            </div>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "var(--text-alt)",
              }}
            >
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
              />
              Include notes header
            </label>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "var(--text-alt)",
              }}
            >
              <input
                type="checkbox"
                checked={includeAutoUsageComments}
                onChange={(e) => setIncludeAutoUsageComments(e.target.checked)}
              />
              Include Auto usage comments
            </label>
            <TextArea
              readOnly
              value={serializedCombined}
              onChange={() => {}}
              monospaced
              style={{ height: 280, resize: "vertical" }}
            />
          </div>

          {/* Separated outputs below combined */}
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 600 }}>EMV.Auto</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(serializedAuto)}
                >
                  Copy Auto
                </Button>
                <Button
                  variant="primary"
                  onClick={() => downloadText("EMV.Auto.lua", serializedAuto)}
                >
                  Download Auto
                </Button>
              </div>
              <TextArea
                readOnly
                value={serializedAuto}
                onChange={() => {}}
                monospaced
                style={{ height: 200, resize: "vertical" }}
              />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 600 }}>EMV.Selections</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(serializedSelections)}
                >
                  Copy Selections
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    downloadText("EMV.Selections.lua", serializedSelections)
                  }
                >
                  Download Selections
                </Button>
              </div>
              <TextArea
                readOnly
                value={serializedSelections}
                onChange={() => {}}
                monospaced
                style={{ height: 200, resize: "vertical" }}
              />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 600 }}>
                PI (Meta, States & Positions)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(serializedPI)}
                >
                  Copy PI
                </Button>
                <Button
                  variant="primary"
                  onClick={() => downloadText("PI.lua", serializedPI)}
                >
                  Download PI
                </Button>
              </div>
              <TextArea
                readOnly
                value={serializedPI}
                onChange={() => {}}
                monospaced
                style={{ height: 200, resize: "vertical" }}
              />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 600 }}>EMV.Lamps</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(serializedLamps)}
                >
                  Copy Lamps
                </Button>
                <Button
                  variant="primary"
                  onClick={() => downloadText("EMV.Lamps.lua", serializedLamps)}
                >
                  Download Lamps
                </Button>
              </div>
              <TextArea
                readOnly
                value={serializedLamps}
                onChange={() => {}}
                monospaced
                style={{ height: 200, resize: "vertical" }}
              />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 600 }}>EMV.Sequences</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(serializedSequences)}
                >
                  Copy Sequences
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    downloadText("EMV.Sequences.lua", serializedSequences)
                  }
                >
                  Download Sequences
                </Button>
              </div>
              <TextArea
                readOnly
                value={serializedSequences}
                onChange={() => {}}
                monospaced
                style={{ height: 200, resize: "vertical" }}
              />
            </div>
          </div>
        </section>
      </SectionWrapper>
    </div>
  );
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
  onDuplicateAuto,
}: {
  anchorId?: string;
  selection: Selection;
  autoByIndex: Map<number, AutoItem>;
  autoReferenceCounts: Map<number, number>;
  onChangeAuto: (index: number, changes: Partial<AutoItem>) => void;
  onUnlinkAuto: (optIdx: number, autoIndex: number) => void;
  onAddLinkedAuto: (optIdx: number) => void;
  onRenameSelection: (newName: string) => void;
  onChangeOption: (
    optIdx: number,
    changes: Partial<{ Name: string; Auto: number[] }>
  ) => void;
  onAddOption: () => void;
  onMoveOption: (fromIdx: number, dir: "up" | "down") => void;
  onMoveAutoIndex: (
    optIdx: number,
    indexPos: number,
    dir: "up" | "down"
  ) => void;
  onConfirmRemoveOption: (
    optIdx: number,
    optName: string,
    selName: string
  ) => void;
  onConfirmRemoveAuto: (autoIdx: number, label: string) => void;
  onDuplicateAuto: (optIdx: number, autoIdx: number) => void;
}) {
  // Bind directly to selection.Name to avoid effect-driven state sync
  // Track compact/full mode per option (sub-group) within this selection
  const [compactOptionMap, setCompactOptionMap] = useState<
    Map<number, boolean>
  >(new Map());
  const isOptionCompact = (optIdx: number) =>
    compactOptionMap.get(optIdx) ?? true; // default to compact (true)
  const toggleOptionCompact = (optIdx: number) => {
    setCompactOptionMap((prev) => {
      const next = new Map(prev);
      next.set(optIdx, !(prev.get(optIdx) ?? true));
      return next;
    });
  };
  return (
    <div
      id={anchorId}
      style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Input
          value={selection.Name}
          onChange={(e) => {
            const v = e.target.value;
            const trimmed = v.trim();
            if (trimmed && trimmed.toLowerCase() !== "none") {
              onRenameSelection(trimmed);
            }
          }}
          placeholder="New Group"
          autoFocus={selection.Name.trim() === ""}
          style={{ fontWeight: 600 }}
        />
        <Button variant="primary" onClick={onAddOption}>
          Add Option
        </Button>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {selection.Options.map((opt, optIdx) => (
          <div
            id={`${anchorId}-opt-${optIdx}`}
            key={optIdx}
            style={{
              display: "grid",
              gap: 8,
              border: "1px solid var(--secondary)",
              borderRadius: 8,
              padding: 10,
              background: "var(--primary)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                position: "sticky",
                top: 64,
                background: "var(--primary)",
                zIndex: 4,
                padding: "8px 0",
                borderBottom: "1px solid var(--secondary)",
              }}
            >
              <Input
                value={opt.Name}
                onChange={(e) =>
                  onChangeOption(optIdx, { Name: e.target.value })
                }
                style={{ fontWeight: 500 }}
                width={300}
              />
              <Button
                variant="secondary"
                onClick={() => onMoveOption(optIdx, "up")}
              >
                Move Up
              </Button>
              <Button
                variant="secondary"
                onClick={() => onMoveOption(optIdx, "down")}
              >
                Move Down
              </Button>
              <Button
                variant="secondary"
                onClick={() => toggleOptionCompact(optIdx)}
              >
                {isOptionCompact(optIdx)
                  ? "Switch to full editor"
                  : "Switch to compact editor"}
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  onConfirmRemoveOption(optIdx, opt.Name, selection.Name)
                }
              >
                Remove
              </Button>
            </div>
            <details>
              <summary
                style={{ cursor: "pointer", fontWeight: 500, margin: "4px 0" }}
              >
                Autolinked items
                {opt.Auto.length > 0 ? ` · ${opt.Auto.length}` : ""}
              </summary>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  margin: "6px 0",
                }}
              >
                <Button
                  variant="primary"
                  onClick={() => onAddLinkedAuto(optIdx)}
                >
                  Add empty Auto item and append its index
                </Button>
                <span style={{ fontSize: 12, color: "#666" }}>
                  (New item will be appended to EMV.Auto and its index added to
                  this option)
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  marginTop: 8,
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(min(500px, 100%), 1fr))",
                }}
              >
                {opt.Auto.length === 0 && (
                  <div style={{ color: "#666" }}>No linked Auto items</div>
                )}
                {opt.Auto.map((idx) => {
                  const item = autoByIndex.get(idx);
                  if (!item)
                    return (
                      <div key={idx} style={{ color: "red" }}>
                        Missing Auto index {idx}
                      </div>
                    );
                  return (
                    <AutoItemEditor
                      key={`${optIdx}-${idx}`}
                      anchorId={`${anchorId}-opt-${optIdx}-auto-${idx}`}
                      item={item}
                      onChange={(ch) => onChangeAuto(idx, ch)}
                      onConfirmRemove={() =>
                        onConfirmRemoveAuto(idx, `#${idx} – ${item.ID}`)
                      }
                      onDuplicate={() => onDuplicateAuto(optIdx, idx)}
                      compact={isOptionCompact(optIdx)}
                      referenceCount={autoReferenceCounts.get(idx) ?? 0}
                    />
                  );
                })}
              </div>
              {/* Unlink controls per auto index within this option */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 8,
                }}
              >
                {opt.Auto.map((autoIdx) => (
                  <Button
                    key={`unlink-${optIdx}-${autoIdx}`}
                    variant="danger"
                    onClick={() => onUnlinkAuto(optIdx, autoIdx)}
                  >
                    Unlink #{autoIdx} from this option
                  </Button>
                ))}
              </div>
            </details>
            <div style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#666" }}>
                Auto indices (comma-separated)
              </span>
              <Input
                value={opt.Auto.join(", ")}
                onChange={(e) => {
                  const nums = e.target.value
                    .split(/[,\s]+/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s) => parseInt(s, 10))
                    .filter((n) => !Number.isNaN(n));
                  onChangeOption(optIdx, { Auto: nums });
                }}
              />
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 4,
                }}
              >
                {opt.Auto.map((_, i) => (
                  <span
                    key={`ctl-${i}`}
                    style={{
                      display: "inline-flex",
                      gap: 4,
                      alignItems: "center",
                    }}
                  >
                    <Button
                      variant="secondary"
                      onClick={() => onMoveAutoIndex(optIdx, i, "up")}
                    >
                      ↑ {i + 1}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => onMoveAutoIndex(optIdx, i, "down")}
                    >
                      ↓ {i + 1}
                    </Button>
                  </span>
                ))}
              </div>
              {opt.Auto.some((n) => !autoByIndex.has(n)) && (
                <div style={{ color: "red" }}>
                  Warning: Option references missing Auto indices.
                </div>
              )}
            </div>
            {/* {optIdx < selection.Options.length - 1 && (
              <div
                style={{
                  width: "100%",
                  borderTop: "1px dashed #c3c3c3",
                  margin: "12px 0",
                }}
              />
            )} */}
          </div>
        ))}
      </div>
    </div>
  );
}

function AutoItemEditor({
  item,
  onChange,
  onConfirmRemove,
  onDuplicate,
  compact,
  referenceCount,
  anchorId,
}: {
  item: AutoItem;
  onChange: (changes: Partial<AutoItem>) => void;
  onConfirmRemove?: () => void;
  onDuplicate?: () => void;
  compact?: boolean;
  referenceCount?: number;
  anchorId?: string;
}) {
  const rowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  };
  return (
    <div
      id={anchorId}
      style={{
        border: "1px solid var(--secondary)",
        borderRadius: 8,
        padding: 8,
        background: "var(--background)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 500 }}>
          #{item.index} – {item.ID}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{ fontSize: 12, color: referenceCount ? "#666" : "#b00020" }}
          >
            {referenceCount
              ? `Referenced in ${referenceCount} option${
                  referenceCount === 1 ? "" : "s"
                }`
              : "Warning: Not referenced in any selection"}
          </div>
          {onDuplicate && (
            <Button variant="secondary" onClick={() => onDuplicate?.()}>
              Duplicate
            </Button>
          )}
          {onConfirmRemove && (
            <Button variant="danger" onClick={() => onConfirmRemove?.()}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span>ID</span>
          <Input
            value={item.ID}
            onChange={(e) => onChange({ ID: e.target.value })}
          />
        </label>
        {!compact && (
          <label style={{ display: "grid", gap: 4 }}>
            <span>Scale</span>
            <Input
              type="number"
              value={item.Scale ?? ""}
              onChange={(e) => onChange({ Scale: parseFloat(e.target.value) })}
            />
          </label>
        )}
        {!compact && (
          <div style={rowStyle}>
            <label style={{ display: "grid", gap: 4 }}>
              <span>Pos X</span>
              <Input
                type="number"
                value={item.Pos?.x ?? ""}
                onChange={(e) =>
                  onChange({
                    Pos: {
                      ...(item.Pos ?? { x: 0, y: 0, z: 0 }),
                      x: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span>Pos Y</span>
              <Input
                type="number"
                value={item.Pos?.y ?? ""}
                onChange={(e) =>
                  onChange({
                    Pos: {
                      ...(item.Pos ?? { x: 0, y: 0, z: 0 }),
                      y: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span>Pos Z</span>
              <Input
                type="number"
                value={item.Pos?.z ?? ""}
                onChange={(e) =>
                  onChange({
                    Pos: {
                      ...(item.Pos ?? { x: 0, y: 0, z: 0 }),
                      z: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </label>
          </div>
        )}
        {!compact && (
          <div style={rowStyle}>
            <label style={{ display: "grid", gap: 4 }}>
              <span>Ang P</span>
              <Input
                type="number"
                value={item.Ang?.p ?? ""}
                onChange={(e) =>
                  onChange({
                    Ang: {
                      ...(item.Ang ?? { p: 0, y: 0, r: 0 }),
                      p: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span>Ang Y</span>
              <Input
                type="number"
                value={item.Ang?.y ?? ""}
                onChange={(e) =>
                  onChange({
                    Ang: {
                      ...(item.Ang ?? { p: 0, y: 0, r: 0 }),
                      y: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span>Ang R</span>
              <Input
                type="number"
                value={item.Ang?.r ?? ""}
                onChange={(e) =>
                  onChange({
                    Ang: {
                      ...(item.Ang ?? { p: 0, y: 0, r: 0 }),
                      r: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </label>
          </div>
        )}
        <div style={rowStyle}>
          <label style={{ display: "grid", gap: 4 }}>
            <span>Color1</span>
            <Input
              value={item.Color1 ?? ""}
              onChange={(e) => onChange({ Color1: e.target.value })}
            />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span>Color2</span>
            <Input
              value={item.Color2 ?? ""}
              onChange={(e) => onChange({ Color2: e.target.value })}
            />
          </label>
          {!compact && (
            <label style={{ display: "grid", gap: 4 }}>
              <span>Phase</span>
              <Input
                value={item.Phase ?? ""}
                onChange={(e) => onChange({ Phase: e.target.value })}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

type ButtonProps = {
  variant?: "primary" | "secondary" | "danger";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
  title?: string;
};

function Button({
  variant = "secondary",
  onClick,
  children,
  disabled,
  style,
  title,
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const base: React.CSSProperties = {
    appearance: "none",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    transition:
      "background-color 120ms ease, border-color 120ms ease, color 120ms ease, filter 120ms ease",
    border: "2px solid transparent",
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--accent)",
      color: "var(--accent-text)",
      borderColor: "var(--accent)",
    },
    secondary: {
      background: "var(--primary)",
      color: "var(--text)",
      borderColor: "var(--secondary)",
    },
    danger: {
      background: "var(--form-color-invalid)",
      color: "var(--text-inverse)",
      borderColor: "var(--form-color-invalid)",
    },
  };
  // Hover: slightly adjust background using available variables
  const hover: React.CSSProperties = disabled
    ? {}
    : variant === "secondary"
    ? { background: "var(--secondary)" }
    : variant === "primary"
    ? { background: "var(--accent-hover)" }
    : { background: "var(--form-color-invalid-hover)" };

  // Active (pressed): transparent background with colored outline
  const activeStyle: React.CSSProperties =
    active && !disabled
      ? variant === "secondary"
        ? {
            background: "transparent",
            borderColor: "var(--secondary)",
            color: "var(--text)",
          }
        : variant === "primary"
        ? {
            background: "transparent",
            borderColor: "var(--accent)",
            color: "var(--accent)",
          }
        : {
            background: "transparent",
            borderColor: "var(--form-color-invalid)",
            color: "var(--form-color-invalid)",
          }
      : {};
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        ...base,
        ...(variants[variant] ?? variants.secondary),
        ...(hovered ? hover : {}),
        ...activeStyle,
        ...(style ?? {}),
      }}
    >
      {children}
    </button>
  );
}

type InputProps = {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
  invalid?: boolean;
  width?: number | string;
  autoFocus?: boolean;
};

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  style,
  invalid = false,
  width,
  autoFocus,
}: InputProps) {
  const base: React.CSSProperties = {
    appearance: "none",
    borderRadius: 8,
    padding: "6px 8px",
    fontSize: 13,
    color: "var(--text)",
    background: "var(--primary)",
    border: "2px solid var(--secondary)",
    outline: "none",
    width: width ?? undefined,
    transition:
      "border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease",
  };
  const invalidStyle: React.CSSProperties = invalid
    ? {
        borderColor: "var(--form-color-invalid)",
        boxShadow: "0 0 0 2px var(--form-color-invalid-opac)",
      }
    : {};
  const [focused, setFocused] = useState(false);
  const focusStyle: React.CSSProperties = focused
    ? {
        borderColor: "var(--accent)",
        boxShadow: "0 0 0 2px var(--form-color-selector-opac)",
      }
    : {};
  return (
    <input
      value={typeof value === "number" ? String(value) : value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      autoFocus={autoFocus}
      style={{ ...base, ...invalidStyle, ...focusStyle, ...(style ?? {}) }}
    />
  );
}

type TextAreaProps = {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
  invalid?: boolean;
  width?: number | string;
  autoFocus?: boolean;
  monospaced?: boolean;
  readOnly?: boolean;
};

function TextArea({
  value,
  id,
  onChange,
  placeholder,
  rows = 6,
  style,
  invalid = false,
  width,
  autoFocus,
  monospaced = false,
  readOnly,
}: TextAreaProps) {
  const base: React.CSSProperties = {
    appearance: "none",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    color: "var(--text)",
    background: "var(--primary)",
    border: "2px solid var(--secondary)",
    outline: "none",
    width: width ?? undefined,
    transition:
      "border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease",
    resize: "vertical",
    lineHeight: 1.4,
    fontFamily: monospaced
      ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      : undefined,
    textWrap: "nowrap",
  };
  const invalidStyle: React.CSSProperties = invalid
    ? {
        borderColor: "var(--form-color-invalid)",
        boxShadow: "0 0 0 2px var(--form-color-invalid-opac)",
      }
    : {};
  const [focused, setFocused] = useState(false);
  const focusStyle: React.CSSProperties = focused
    ? {
        borderColor: "var(--accent)",
        boxShadow: "0 0 0 2px var(--form-color-selector-opac)",
      }
    : {};
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      autoFocus={autoFocus}
      readOnly={readOnly}
      style={{ ...base, ...invalidStyle, ...focusStyle, ...(style ?? {}) }}
    />
  );
}

function SectionWrapper({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState<boolean>(!!defaultOpen);
  return (
    <div
      style={{
        border: "2px solid var(--secondary)",
        background: "var(--primary)",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <details
        open={open}
        onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary
          style={{
            cursor: "pointer",
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--text-alt)",
            position: open ? ("sticky" as const) : "static",
            top: 0,
            background: open ? "var(--primary)" : undefined,
            zIndex: 7,
            padding: "4px 0",
          }}
        >
          {title}
        </summary>
        {children}
      </details>
    </div>
  );
}

function WarningBox({
  title,
  children,
  variant = "error",
  style,
}: {
  title?: string;
  children: React.ReactNode;
  variant?: "error" | "warning" | "info";
  style?: React.CSSProperties;
}) {
  const palette = {
    error: {
      border: "#f5c2c7",
      bg: "#f8d7da",
      color: "#842029",
    },
    warning: {
      border: "#ffe69c",
      bg: "#fff3cd",
      color: "#664d03",
    },
    info: {
      border: "#b6d4fe",
      bg: "#cfe2ff",
      color: "#084298",
    },
  } as const;
  const theme = palette[variant];
  return (
    <div
      style={{
        border: `1px solid ${theme.border}`,
        background: theme.bg,
        color: theme.color,
        padding: 12,
        borderRadius: 8,
        ...(style ?? {}),
      }}
    >
      {title && <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>}
      {children}
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 380,
          maxWidth: "90vw",
          background: "var(--primary)",
          border: "2px solid var(--secondary)",
          borderRadius: 12,
          boxShadow: "0 10px 24px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{ padding: 12, borderBottom: "1px solid var(--secondary)" }}
        >
          <div style={{ fontWeight: 700, color: "var(--text-alt)" }}>
            {title ?? "Confirm"}
          </div>
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ marginBottom: 12 }}>{message}</div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {cancelText && (
              <Button variant="secondary" onClick={onCancel}>
                {cancelText}
              </Button>
            )}
            <Button variant="danger" onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PIStatesEditor({
  pi,
  onChange,
}: {
  pi: PI;
  onChange: (next: PI) => void;
}) {
  const addState = () => {
    const name = prompt("New state name (letters/underscores only):")?.trim();
    if (!name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return;
    if (pi.States[name]) return;
    onChange({ States: { ...pi.States, [name]: [] } });
  };
  const removeState = (name: string) => {
    const next = { ...pi.States };
    delete next[name];
    onChange({ States: next });
  };
  const addEntry = (name: string) => {
    const idxStr = prompt("Index (number):");
    if (!idxStr) return;
    const idx = parseInt(idxStr, 10);
    if (Number.isNaN(idx)) return;
    const color = prompt(
      "Color (identifier like R, B, SW, WHITE, etc.):"
    )?.trim();
    if (!color) return;
    const valStr = prompt("Value (number):");
    if (!valStr) return;
    const value = parseFloat(valStr);
    if (Number.isNaN(value)) return;
    const entries = [...(pi.States[name] ?? []), { index: idx, color, value }];
    onChange({ States: { ...pi.States, [name]: entries } });
  };
  const updateEntry = (
    name: string,
    i: number,
    entry: { index: number; color: string; value: number }
  ) => {
    const entries = [...(pi.States[name] ?? [])];
    entries[i] = entry;
    onChange({ States: { ...pi.States, [name]: entries } });
  };
  const removeEntry = (name: string, i: number) => {
    const entries = [...(pi.States[name] ?? [])];
    entries.splice(i, 1);
    onChange({ States: { ...pi.States, [name]: entries } });
  };
  const moveEntry = (name: string, i: number, dir: "up" | "down") => {
    const entries = [...(pi.States[name] ?? [])];
    const to = i + (dir === "up" ? -1 : 1);
    if (to < 0 || to >= entries.length) return;
    const [item] = entries.splice(i, 1);
    entries.splice(to, 0, item);
    onChange({ States: { ...pi.States, [name]: entries } });
  };
  const stateNames = Object.keys(pi.States);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="primary" onClick={addState}>
          Add State
        </Button>
      </div>
      {stateNames.length === 0 && (
        <div style={{ color: "#666" }}>
          No PI states parsed. Add a state to begin.
        </div>
      )}
      {stateNames.map((name) => (
        <div
          key={name}
          style={{
            border: "1px solid var(--secondary)",
            borderRadius: 8,
            padding: 10,
            background: "var(--background)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600 }}>{name}</span>
              <span style={{ fontSize: 12, color: "#666" }}>
                {pi.States[name]?.length ?? 0} entries
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" onClick={() => addEntry(name)}>
                Add Entry
              </Button>
              <Button variant="danger" onClick={() => removeState(name)}>
                Remove State
              </Button>
            </div>
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {(pi.States[name] ?? []).map((e, i) => (
              <div
                key={`${name}-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr auto",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <label style={{ display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--text-alt)" }}>
                    Index
                  </span>
                  <Input
                    type="number"
                    value={e.index}
                    onChange={(ev) =>
                      updateEntry(name, i, {
                        ...e,
                        index: parseInt(ev.target.value, 10) || 0,
                      })
                    }
                  />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--text-alt)" }}>
                    Color
                  </span>
                  <Input
                    value={e.color}
                    onChange={(ev) =>
                      updateEntry(name, i, { ...e, color: ev.target.value })
                    }
                  />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--text-alt)" }}>
                    Value
                  </span>
                  <Input
                    type="number"
                    value={e.value}
                    onChange={(ev) =>
                      updateEntry(name, i, {
                        ...e,
                        value: parseFloat(ev.target.value) || 0,
                      })
                    }
                  />
                </label>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Button
                    variant="secondary"
                    onClick={() => moveEntry(name, i, "up")}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => moveEntry(name, i, "down")}
                  >
                    ↓
                  </Button>
                  <Button variant="danger" onClick={() => removeEntry(name, i)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PIPositionsEditor({
  positions,
  onChange,
}: {
  positions: NonNullable<PI["Positions"]>;
  onChange: (next: NonNullable<PI["Positions"]>) => void;
}) {
  const addPosition = () => {
    const idxStr = prompt("Position index (number):");
    if (!idxStr) return;
    const idx = parseInt(idxStr, 10);
    if (Number.isNaN(idx) || positions[idx]) return;
    onChange({
      ...positions,
      [idx]: { pos: { x: 0, y: 0, z: 0 }, ang: { p: 0, y: 0, r: 0 } },
    });
  };
  const removePosition = (idx: number) => {
    const next = { ...positions };
    delete next[idx];
    onChange(next);
  };
  const updatePos = (idx: number, key: "x" | "y" | "z", v: number) => {
    const entry = positions[idx];
    onChange({
      ...positions,
      [idx]: { ...entry, pos: { ...entry.pos, [key]: v } },
    });
  };
  const updateAng = (idx: number, key: "p" | "y" | "r", v: number) => {
    const entry = positions[idx];
    onChange({
      ...positions,
      [idx]: { ...entry, ang: { ...entry.ang, [key]: v } },
    });
  };
  const updateName = (idx: number, name?: string) => {
    const entry = positions[idx];
    onChange({ ...positions, [idx]: { ...entry, name } });
  };
  const indices = Object.keys(positions)
    .map((s) => parseInt(s, 10))
    .sort((a, b) => a - b);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="primary" onClick={addPosition}>
          Add Position
        </Button>
      </div>
      {indices.length === 0 && (
        <div style={{ color: "#666" }}>No positions parsed.</div>
      )}
      {indices.map((idx) => {
        const e = positions[idx];
        return (
          <div
            key={idx}
            style={{
              border: "1px solid var(--secondary)",
              borderRadius: 8,
              padding: 10,
              background: "var(--background)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontWeight: 600 }}>[{idx}]</div>
              <Button variant="danger" onClick={() => removePosition(idx)}>
                Remove
              </Button>
            </div>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                }}
              >
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Pos X</span>
                  <Input
                    type="number"
                    value={e.pos.x}
                    onChange={(ev) =>
                      updatePos(idx, "x", parseFloat(ev.target.value) || 0)
                    }
                  />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Pos Y</span>
                  <Input
                    type="number"
                    value={e.pos.y}
                    onChange={(ev) =>
                      updatePos(idx, "y", parseFloat(ev.target.value) || 0)
                    }
                  />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Pos Z</span>
                  <Input
                    type="number"
                    value={e.pos.z}
                    onChange={(ev) =>
                      updatePos(idx, "z", parseFloat(ev.target.value) || 0)
                    }
                  />
                </label>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                }}
              >
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Ang P</span>
                  <Input
                    type="number"
                    value={e.ang.p}
                    onChange={(ev) =>
                      updateAng(idx, "p", parseFloat(ev.target.value) || 0)
                    }
                  />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Ang Y</span>
                  <Input
                    type="number"
                    value={e.ang.y}
                    onChange={(ev) =>
                      updateAng(idx, "y", parseFloat(ev.target.value) || 0)
                    }
                  />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Ang R</span>
                  <Input
                    type="number"
                    value={e.ang.r}
                    onChange={(ev) =>
                      updateAng(idx, "r", parseFloat(ev.target.value) || 0)
                    }
                  />
                </label>
              </div>
              <label style={{ display: "grid", gap: 4 }}>
                <span>Name (optional)</span>
                <Input
                  value={e.name ?? ""}
                  onChange={(ev) =>
                    updateName(idx, ev.target.value || undefined)
                  }
                />
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PIMetaEditor({
  meta,
  onChange,
}: {
  meta: NonNullable<PI["Meta"]>;
  onChange: (next: NonNullable<PI["Meta"]>) => void;
}) {
  const addMeta = () => {
    const name = prompt("New meta name (letters/underscores only):")?.trim();
    if (!name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return;
    if (meta[name]) return;
    onChange({ ...meta, [name]: {} });
  };
  const removeMeta = (name: string) => {
    const next = { ...meta };
    delete next[name];
    onChange(next);
  };
  const setField = (
    name: string,
    key: keyof NonNullable<PI["Meta"]>[string],
    value: number | string | undefined
  ) => {
    const entry = meta[name] ?? {};
    const updated = { ...entry };
    if (value === undefined || value === "") {
      delete (updated as Record<string, unknown>)[key as string];
    } else {
      (updated as Record<string, unknown>)[key as string] = value;
    }
    onChange({ ...meta, [name]: updated });
  };
  const names = Object.keys(meta);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="primary" onClick={addMeta}>
          Add Meta
        </Button>
      </div>
      {names.length === 0 && (
        <div style={{ color: "#666" }}>No PI.Meta entries parsed.</div>
      )}
      {names.map((name) => {
        const m = meta[name] ?? {};
        return (
          <div
            key={name}
            style={{
              border: "1px solid var(--secondary)",
              borderRadius: 8,
              padding: 10,
              background: "var(--background)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontWeight: 600 }}>{name}</div>
              <Button variant="danger" onClick={() => removeMeta(name)}>
                Remove
              </Button>
            </div>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                <label style={{ display: "grid", gap: 4 }}>
                  <span>AngleOffset</span>
                  <Input
                    type="number"
                    value={m.AngleOffset ?? ""}
                    onChange={(e) =>
                      setField(name, "AngleOffset", parseFloat(e.target.value))
                    }
                  />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>W</span>
                  <Input
                    type="number"
                    value={m.W ?? ""}
                    onChange={(e) =>
                      setField(name, "W", parseFloat(e.target.value))
                    }
                  />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>H</span>
                  <Input
                    type="number"
                    value={m.H ?? ""}
                    onChange={(e) =>
                      setField(name, "H", parseFloat(e.target.value))
                    }
                  />
                </label>
              </div>
              <label style={{ display: "grid", gap: 4 }}>
                <span>Sprite</span>
                <Input
                  value={m.Sprite ?? ""}
                  onChange={(e) => setField(name, "Sprite", e.target.value)}
                />
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                <label style={{ display: "grid", gap: 4 }}>
                  <span>Scale</span>
                  <Input
                    type="number"
                    value={m.Scale ?? ""}
                    onChange={(e) =>
                      setField(name, "Scale", parseFloat(e.target.value))
                    }
                  />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>VisRadius</span>
                  <Input
                    type="number"
                    value={m.VisRadius ?? ""}
                    onChange={(e) =>
                      setField(name, "VisRadius", parseFloat(e.target.value))
                    }
                  />
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span>WMult</span>
                  <Input
                    type="number"
                    value={m.WMult ?? ""}
                    onChange={(e) =>
                      setField(name, "WMult", parseFloat(e.target.value))
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
