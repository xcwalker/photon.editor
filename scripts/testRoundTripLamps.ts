import { parseLuaForEMV, serializeEMVLamps, serializeEMVLampsMeta } from '../src/luaParser'

// Array-style Lamps round-trip
const luaArray = `
EMV.Lamps = {
  { ID = "Corner", Pos = Vector(1, 2, 3), Ang = Angle(0, 90, 0), Color = AMBER },
  { ID = "Rear", Pos = Vector(4.5, 6.25, 7), Ang = Angle(1, 2, 3), Color = "WHITE" }
}
`

const parsedArray1 = parseLuaForEMV(luaArray)
const outArray = serializeEMVLamps(parsedArray1.lamps ?? [])
const parsedArray2 = parseLuaForEMV(outArray)

if ((parsedArray1.lamps?.length ?? 0) !== (parsedArray2.lamps?.length ?? 0)) {
  console.error('FAIL: Lamps length mismatch (array)')
  process.exit(1)
}

const sameArray = (parsedArray1.lamps ?? []).every((l, i) => {
  const r = (parsedArray2.lamps ?? [])[i]
  return l.ID === r.ID && l.Color === r.Color && !!l.Pos && !!r.Pos && !!l.Ang && !!r.Ang
})

if (!sameArray) {
  console.error('FAIL: Lamps round-trip mismatch (array)')
  process.exit(1)
}

console.log('PASS: Lamps round-trip (array)')

// Dictionary-style LampsMeta round-trip
const luaMeta = `
EMV.Lamps = {
  ["Corner"] = { Color = Color(255, 128, 0), Texture = "sprites/emv/corner", Near = 0.2, FOV = 180, Distance = 12 },
  ["Rear"] = { Color = Color(255, 255, 255, 0.9), Texture = "sprites/emv/rear", Near = 0.1, FOV = 160, Distance = 10 }
}
`

const parsedMeta1 = parseLuaForEMV(luaMeta)
// ensure lampsMeta parsed
if (!parsedMeta1.lampsMeta || Object.keys(parsedMeta1.lampsMeta).length !== 2) {
  console.error('FAIL: LampsMeta parse failed (initial)')
  process.exit(1)
}
const outMeta = serializeEMVLampsMeta(parsedMeta1.lampsMeta)
const parsedMeta2 = parseLuaForEMV(outMeta)

if (!parsedMeta2.lampsMeta || Object.keys(parsedMeta2.lampsMeta).length !== 2) {
  console.error('FAIL: LampsMeta parse failed (round-trip)')
  process.exit(1)
}

// Compare key fields for both entries
const keys = Object.keys(parsedMeta1.lampsMeta)
const metaSame = keys.every((k) => {
  const a = parsedMeta1.lampsMeta![k]
  const b = parsedMeta2.lampsMeta![k]
  const colorEqual = !!a.Color && !!b.Color && a.Color.r === b.Color.r && a.Color.g === b.Color.g && a.Color.b === b.Color.b && (a.Color.a ?? undefined) === (b.Color.a ?? undefined)
  const texEqual = (a.Texture ?? '') === (b.Texture ?? '')
  const nearEqual = (a.Near ?? NaN) === (b.Near ?? NaN)
  const fovEqual = (a.FOV ?? NaN) === (b.FOV ?? NaN)
  const distEqual = (a.Distance ?? NaN) === (b.Distance ?? NaN)
  return colorEqual && texEqual && nearEqual && fovEqual && distEqual
})

if (!metaSame) {
  console.error('FAIL: LampsMeta round-trip mismatch')
  process.exit(1)
}

console.log('PASS: LampsMeta round-trip')
