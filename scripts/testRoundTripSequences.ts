import { readFileSync } from 'fs'
import { parseLuaForEMV, serializeEMVSequences, type Sequence } from '../src/functions/luaParser'

function sequencesKey(seq: Sequence) {
  return {
    Group: seq.Group,
    Name: seq.Name,
    Stage: seq.Stage,
    Components: seq.Components,
    Lights: seq.Lights,
    Disconnect: seq.Disconnect,
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function main() {
  const lua = readFileSync('./public/example.lua', 'utf-8')
  const parsed = parseLuaForEMV(lua)
  assert(!!parsed.sequences && parsed.sequences.length > 0, 'No sequences parsed')

  const ser = serializeEMVSequences(parsed.sequences!)
  // Re-parse serialized sequences by embedding into a dummy EMV.Sequences block
  const lua2 = `EMV.Sequences = ${ser.split('EMV.Sequences = ')[1]}`
  const parsed2 = parseLuaForEMV(lua2)
  assert(!!parsed2.sequences && parsed2.sequences.length === parsed.sequences!.length, 'Sequence count changed on round-trip')

  // Shallow compare key fields for each sequence
  for (let i = 0; i < parsed.sequences!.length; i++) {
    const a = sequencesKey(parsed.sequences![i])
    const b = sequencesKey(parsed2.sequences![i])
    assert(a.Name === b.Name, `Name mismatch at ${i}: ${a.Name} vs ${b.Name}`)
    assert(a.Stage === b.Stage, `Stage mismatch at ${i}: ${a.Stage} vs ${b.Stage}`)
    // Components, Disconnect length checks where applicable
    if (Array.isArray(a.Components) && Array.isArray(b.Components)) {
      const ac = a.Components as unknown[]
      const bc = b.Components as unknown[]
      assert(ac.length === bc.length, `Components length mismatch at ${i}`)
    }
    if (a.Disconnect && b.Disconnect) {
      assert(a.Disconnect.length === b.Disconnect.length, `Disconnect length mismatch at ${i}`)
    }
    if (a.Lights && b.Lights) {
      assert(a.Lights.length === b.Lights.length, `Lights length mismatch at ${i}`)
    }
  }
  console.log('Round-trip Sequences: PASS')
}

main()
