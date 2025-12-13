import { parseLuaForEMV, serializeEMVLamps } from '../src/luaParser'

const lua = `
EMV.Lamps = {
  { ID = "Corner", Pos = Vector(1, 2, 3), Ang = Angle(0, 90, 0), Color = AMBER },
  { ID = "Rear", Pos = Vector(4.5, 6.25, 7), Ang = Angle(1, 2, 3), Color = "WHITE" }
}
`

const parsed = parseLuaForEMV(lua)
if (!parsed.lamps || parsed.lamps.length !== 2) {
  console.error('FAIL: Expected 2 lamps, got', parsed.lamps?.length)
  process.exit(1)
}

const l0 = parsed.lamps[0]
if (l0.ID !== 'Corner' || !l0.Pos || l0.Pos.x !== 1 || !l0.Ang || l0.Ang.y !== 90 || l0.Color !== 'AMBER') {
  console.error('FAIL: Lamp 0 fields mismatch', l0)
  process.exit(1)
}

const out = serializeEMVLamps(parsed.lamps)
if (!out.includes('EMV.Lamps = {') || !out.includes('ID = "Corner"') || !out.includes('Color = AMBER')) {
  console.error('FAIL: Serialized lamps missing expected content')
  console.error(out)
  process.exit(1)
}

console.log('PASS: Lamps parse & serialize')
