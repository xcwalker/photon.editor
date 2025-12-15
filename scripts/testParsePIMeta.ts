import { readFileSync } from 'fs'
import { join } from 'path'
import { parseLuaForEMV } from '../src/functions/luaParser'

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

const luaPath = join(process.cwd(), 'public', 'example.lua')
const luaText = readFileSync(luaPath, 'utf-8')

const parsed = parseLuaForEMV(luaText)
assert(parsed.pi, 'PI should be parsed')
assert(parsed.pi!.Meta, 'PI.Meta should be parsed')

const meta = parsed.pi!.Meta!
assert(meta.brake?.WMult === 1.2, 'PI.Meta.brake.WMult should be 1.2')
assert(meta.head_low?.VisRadius === 16, 'PI.Meta.head_low.VisRadius should be 16')
// indicator has a Sprite in example (omitted but present); ensure it exists as string when present
if (meta.indicator && meta.indicator.Sprite !== undefined) {
  assert(typeof meta.indicator.Sprite === 'string', 'PI.Meta.indicator.Sprite should be a string when present')
}

console.log('PI.Meta parse test: PASS')
