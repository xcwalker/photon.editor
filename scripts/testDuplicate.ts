/*
  Simple duplication test:
  - Parse example.lua
  - Duplicate the last Auto item (simulate clone and append)
  - Link the duplicated index to the first selection's first option
  - Verify serialization includes the new Auto and the option references it
*/

import { readFileSync } from 'fs'
import { join } from 'path'
import { parseLuaForEMV, serializeEMVAuto, serializeEMVSelections, type AutoItem } from '../src/luaParser'

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ ${msg}`)
    process.exit(1)
  }
}

const luaPath = join(process.cwd(), 'public', 'example.lua')
const lua = readFileSync(luaPath, 'utf-8')
const parsed = parseLuaForEMV(lua)

// Pre-conditions
assert(parsed.auto.length > 0, 'There should be at least one Auto item')
assert(parsed.selections.length > 0, 'There should be at least one selection')
assert(parsed.selections[0].Options.length > 0, 'First selection should have at least one option')

// Duplicate last auto
const last = parsed.auto[parsed.auto.length - 1]
const nextIndex = parsed.auto.length + 1
const dup: AutoItem = { ...last, index: nextIndex }
parsed.auto.push(dup)

// Link to first selection, first option
parsed.selections[0].Options[0].Auto.push(nextIndex)

// Serialize and re-parse to validate structure
const autoOut = serializeEMVAuto(parsed.auto)
const selOut = serializeEMVSelections(parsed.selections)
const roundTrip = parseLuaForEMV(autoOut + "\n" + selOut)

assert(roundTrip.auto.length === parsed.auto.length, 'Round-trip auto length should match after duplication')
assert(roundTrip.auto[roundTrip.auto.length - 1].index === nextIndex, 'Last auto should have the duplicated index')
assert(roundTrip.selections[0].Options[0].Auto.includes(nextIndex), 'First option should reference duplicated index')

console.log('✅ Duplication test passed')
