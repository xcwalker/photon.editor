import { readFileSync } from 'fs'
import { parseLuaForEMV, serializeEMVAuto } from '../src/luaParser'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ${message}`)
    process.exit(1)
  }
}

function run() {
  const lua = readFileSync('./public/example.lua', 'utf-8')
  const parsed = parseLuaForEMV(lua)

  // Basic sanity
  assert(parsed.auto.length > 0, 'Parsed EMV.Auto items')

  const first = parsed.auto[0]
  // Colors should be parsed as identifiers when present (e.g., Color1/Color2)
  assert(!!first.Color1, 'First auto has Color1')
  assert(!!first.Color2, 'First auto has Color2')
  assert(first.Color1 === 'Color1', `Color1 parsed as identifier, got ${first.Color1}`)
  assert(first.Color2 === 'Color2', `Color2 parsed as identifier, got ${first.Color2}`)

  // Serialization should keep identifiers unquoted
  const out = serializeEMVAuto(parsed.auto, undefined)
  assert(out.includes('Color1 = Color1'), 'Serialized Color1 identifier unquoted')
  assert(out.includes('Color2 = Color2'), 'Serialized Color2 identifier unquoted')

  // Find an item with quoted color (e.g., Whelen Ion with "WHITE")
  const hasQuotedWhite = parsed.auto.some((it) => it.ID.includes('Whelen Ion') && it.Color1 === 'WHITE')
  assert(hasQuotedWhite, 'Found an auto item with Color1 = "WHITE"')
  assert(out.includes('Color1 = "WHITE"'), 'Serialized quoted color preserved with quotes')

  console.log('✅ Colors parse/serialize test passed')
}

run()
