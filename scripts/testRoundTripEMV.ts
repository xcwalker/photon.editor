import { readFileSync } from 'fs'
import { join } from 'path'
import { parseLuaForEMV, serializeEMVAuto, serializeEMVSelections } from '../src/functions/luaParser'

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

// Load example.lua
const luaPath = join(process.cwd(), 'public', 'example.lua')
const luaText = readFileSync(luaPath, 'utf-8')

const parsed1 = parseLuaForEMV(luaText)

// Serialize EMV.Auto & EMV.Selections, then re-parse
const serializedAuto = serializeEMVAuto(parsed1.auto, parsed1.selections)
const serializedSelections = serializeEMVSelections(parsed1.selections)
const serializedCombined = `${serializedAuto}\n\n${serializedSelections}`
const parsed2 = parseLuaForEMV(serializedCombined)

// Basic counts
assert(parsed1.auto.length === parsed2.auto.length, 'EMV.Auto item count should round-trip')
assert(parsed1.selections.length === parsed2.selections.length, 'EMV.Selections count should round-trip')

// Compare a subset of fields for each Auto item
for (let i = 0; i < parsed1.auto.length; i++) {
  const a = parsed1.auto[i]
  const b = parsed2.auto[i]
  assert(a.ID === b.ID, `EMV.Auto[${i}].ID should round-trip`)
  if (a.Scale !== undefined || b.Scale !== undefined) {
    assert(Math.abs((a.Scale ?? 0) - (b.Scale ?? 0)) < 1e-6, `EMV.Auto[${i}].Scale should round-trip`)
  }
  if (a.Pos && b.Pos) {
    assert(Math.abs(a.Pos.x - b.Pos.x) < 1e-6, `EMV.Auto[${i}].Pos.x should round-trip`)
    assert(Math.abs(a.Pos.y - b.Pos.y) < 1e-6, `EMV.Auto[${i}].Pos.y should round-trip`)
    assert(Math.abs(a.Pos.z - b.Pos.z) < 1e-6, `EMV.Auto[${i}].Pos.z should round-trip`)
  }
  if (a.Ang && b.Ang) {
    assert(Math.abs(a.Ang.p - b.Ang.p) < 1e-6, `EMV.Auto[${i}].Ang.p should round-trip`)
    assert(Math.abs(a.Ang.y - b.Ang.y) < 1e-6, `EMV.Auto[${i}].Ang.y should round-trip`)
    assert(Math.abs(a.Ang.r - b.Ang.r) < 1e-6, `EMV.Auto[${i}].Ang.r should round-trip`)
  }
  if (a.Color1 || b.Color1) {
    assert(a.Color1 === b.Color1, `EMV.Auto[${i}].Color1 should round-trip`)
  }
  if (a.Color2 || b.Color2) {
    assert(a.Color2 === b.Color2, `EMV.Auto[${i}].Color2 should round-trip`)
  }
  if (a.Phase || b.Phase) {
    assert(a.Phase === b.Phase, `EMV.Auto[${i}].Phase should round-trip`)
  }
}

// Compare selections by name and options length
for (let i = 0; i < parsed1.selections.length; i++) {
  const s1 = parsed1.selections[i]
  const s2 = parsed2.selections[i]
  assert(s1.Name === s2.Name, `EMV.Selections[${i}].Name should round-trip`)
  assert(s1.Options.length === s2.Options.length, `EMV.Selections[${i}].Options length should round-trip`)
  for (let j = 0; j < s1.Options.length; j++) {
    const o1 = s1.Options[j]
    const o2 = s2.Options[j]
    assert(o1.Name === o2.Name, `EMV.Selections[${i}].Options[${j}].Name should round-trip`)
    assert(JSON.stringify(o1.Auto) === JSON.stringify(o2.Auto), `EMV.Selections[${i}].Options[${j}].Auto should round-trip`)
  }
}

console.log('EMV round-trip test: PASS')
