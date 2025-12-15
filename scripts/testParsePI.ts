import { readFileSync } from 'fs'
import { join } from 'path'
import { parseLuaForEMV } from '../src/functions/luaParser'

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

// Load example.lua from public
const luaPath = join(process.cwd(), 'public', 'example.lua')
const luaText = readFileSync(luaPath, 'utf-8')

const parsed = parseLuaForEMV(luaText)

// Basic existence
assert(parsed.pi, 'PI should be parsed')
assert(parsed.pi!.States, 'PI.States should exist')

// Verify known state names from example.lua
const stateNames = Object.keys(parsed.pi!.States)
assert(
  stateNames.includes("Headlights"),
  "PI.States should include Headlights"
);
assert(stateNames.includes('Brakes'), 'PI.States should include Brakes')
assert(stateNames.includes('Blink_Left'), 'PI.States should include Blink_Left')
assert(stateNames.includes('Blink_Right'), 'PI.States should include Blink_Right')
assert(stateNames.includes('Reverse'), 'PI.States should include Reverse')
assert(stateNames.includes('Running'), 'PI.States should include Running')

// Check some entries content for Brakes state
const brakes = parsed.pi!.States['Brakes']
assert(
  Array.isArray(brakes) && brakes.length >= 3,
  "Brakes should have at least 3 entries"
);
assert(brakes.some(e => e.index === 9 && e.color === 'R'), 'Brakes should include {9, R, ...}')

// Positions block should be parsed with indices
assert(parsed.pi!.Positions, 'PI.Positions should be parsed')
const positions = parsed.pi!.Positions!
assert(positions[1] !== undefined, 'PI.Positions should include index [1]')
assert(positions[12]?.name === 'indicator', 'PI.Positions[12] name should be "indicator"')

console.log('PI parse test: PASS')
