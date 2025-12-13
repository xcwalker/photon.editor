import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseLuaForEMV } from '../src/luaParser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

function main() {
  const projectRoot = join(__dirname, '..')
  const luaPath = join(projectRoot, 'public', 'example.lua')
  const luaText = readFileSync(luaPath, 'utf-8')
  const parsed = parseLuaForEMV(luaText)

  console.log(`Parsed selections: ${parsed.selections.length}`)
  const names = parsed.selections.map(s => s.Name)
  console.log('Selection names:', names)

  const expected = 'Lightbar [FRONT] Worklights'
  if (!names.includes(expected)) {
    console.error(`ERROR: Expected selection name not found: ${expected}`)
    process.exit(1)
  }

  const frontIdx = names.indexOf('Lightbar [FRONT]')
  const workIdx = names.indexOf(expected)
  if (frontIdx === -1 || workIdx === -1) {
    console.error('ERROR: Missing expected selection groups.')
    process.exit(1)
  }

  // Additional assertions: option counts and auto indices
  const worklights = parsed.selections[workIdx]
  const front = parsed.selections[frontIdx]
  if (worklights.Options.length < 10) {
    console.error(`ERROR: Worklights options too few: ${worklights.Options.length}`)
    process.exit(1)
  }
  // Worklights should include an option with autos [55,56,57,58]
  const has55665758 = worklights.Options.some(o => [55,56,57,58].every(n => o.Auto.includes(n)))
  if (!has55665758) {
    console.error('ERROR: Worklights missing expected Auto indices [55,56,57,58].')
    process.exit(1)
  }
  // Front should include option with Auto {1}
  const has1 = front.Options.some(o => o.Auto.length === 1 && o.Auto[0] === 1)
  if (!has1) {
    console.error('ERROR: Lightbar [FRONT] missing expected Auto index 1.')
    process.exit(1)
  }
  // Ensure at least one option has empty Auto list in both selections
  const emptyFront = front.Options.some(o => o.Auto.length === 0)
  const emptyWork = worklights.Options.some(o => o.Auto.length === 0)
  if (!emptyFront || !emptyWork) {
    console.error('ERROR: Expected empty Auto options not found in selections.')
    process.exit(1)
  }

  console.log('OK: Expected selection names found.')

  // EMV.Auto assertions: count and IDs
  const autos = parsed.auto
  if (autos.length < 10) {
    console.error(`ERROR: Parsed auto items too few: ${autos.length}`)
    process.exit(1)
  }
  const autoIDs = new Set(autos.map(a => a.ID))
  const requiredIDs = [
    'Whelen Liberty SX',
    'Code 3 RX2700',
    'Code 3 Solex',
    'Federal Signal Integrity',
    'Whelen Ultra Freedom'
  ]
  for (const id of requiredIDs) {
    if (!autoIDs.has(id)) {
      console.error(`ERROR: Expected Auto ID missing: ${id}`)
      process.exit(1)
    }
  }
  // Spot-check first Auto's Vec/Ang fields exist
  const first = autos[0]
  if (!first.Pos || !first.Ang) {
    console.error('ERROR: First auto item missing Pos/Ang parsing.')
    process.exit(1)
  }
  console.log('OK: Auto items parsed and validated.')
}

main()
