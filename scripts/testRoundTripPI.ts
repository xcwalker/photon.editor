import { readFileSync } from 'fs'
import { join } from 'path'
import { parseLuaForEMV, serializePI } from '../src/functions/luaParser'

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

// Load example.lua
const luaPath = join(process.cwd(), 'public', 'example.lua')
const luaText = readFileSync(luaPath, 'utf-8')

const parsed1 = parseLuaForEMV(luaText)
assert(parsed1.pi, 'PI should be parsed')

// Serialize PI and then re-parse from the serialized output
const serializedPI = serializePI(parsed1.pi!)
const parsed2 = parseLuaForEMV(serializedPI)
assert(parsed2.pi, 'PI should be parsed from its own serialized output')

// Compare States
const s1 = parsed1.pi!.States
const s2 = parsed2.pi!.States
const names1 = Object.keys(s1).sort()
const names2 = Object.keys(s2).sort()
assert(JSON.stringify(names1) === JSON.stringify(names2), 'PI.States names should round-trip')

for (const name of names1) {
  const a = s1[name]
  const b = s2[name]
  assert(Array.isArray(a) && Array.isArray(b), `PI.States[${name}] should be arrays`)
  assert(a.length === b.length, `PI.States[${name}] length should round-trip`)
  for (let i = 0; i < a.length; i++) {
    const ea = a[i]
    const eb = b[i]
    assert(ea.index === eb.index, `PI.States[${name}][${i}] index should round-trip`)
    assert(ea.color === eb.color, `PI.States[${name}][${i}] color should round-trip`)
    assert(Math.abs(ea.value - eb.value) < 1e-6, `PI.States[${name}][${i}] value should round-trip`)
  }
}

// Compare Positions (indices only, as ordering is inherent)
if (parsed1.pi!.Positions) {
  assert(parsed2.pi!.Positions, 'PI.Positions should exist after round-trip')
  const idx1 = Object.keys(parsed1.pi!.Positions!).map(Number).sort((a,b)=>a-b)
  const idx2 = Object.keys(parsed2.pi!.Positions!).map(Number).sort((a,b)=>a-b)
  assert(JSON.stringify(idx1) === JSON.stringify(idx2), 'PI.Positions indices should round-trip')
}

console.log('PI round-trip test: PASS')
