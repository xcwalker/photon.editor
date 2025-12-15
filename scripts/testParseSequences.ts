import { parseLuaForEMV, serializeEMVSequences } from '../src/functions/luaParser'

const lua = `
EMV.Sequences = {
  { Name = "Primary", Stage = 1, Components = {1, 2, 3} },
  { Name = "Secondary", Components = {4} }
}
`

const parsed = parseLuaForEMV(lua)
if (!parsed.sequences || parsed.sequences.length !== 2) {
  console.error('FAIL: Expected 2 sequences, got', parsed.sequences?.length)
  process.exit(1)
}

const s0 = parsed.sequences[0]
if (s0.Name !== 'Primary' || s0.Stage !== 1 || !s0.Components || s0.Components.length !== 3) {
  console.error('FAIL: Sequence 0 fields mismatch', s0)
  process.exit(1)
}

const out = serializeEMVSequences(parsed.sequences)
if (!out.includes('EMV.Sequences = {') || !out.includes('Name = "Primary"') || !out.includes('Components = {1, 2, 3}')) {
  console.error('FAIL: Serialized sequences missing expected content')
  console.error(out)
  process.exit(1)
}

console.log('PASS: Sequences parse & serialize')
