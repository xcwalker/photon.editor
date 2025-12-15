import { removeAutoAndAdjust } from '../src/functions/autoUtils'
import type { ParsedEMV } from '../src/functions/luaParser'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

// Build a small fixture
const initial: ParsedEMV = {
  auto: [
    { index: 1, ID: 'A1', Scale: 1, Pos: { x:0,y:0,z:0 }, Ang: { p:0,y:0,r:0 }, Color1: 'AMBER', Color2: 'AMBER' },
    { index: 2, ID: 'A2', Scale: 1, Pos: { x:0,y:0,z:0 }, Ang: { p:0,y:0,r:0 }, Color1: 'AMBER', Color2: 'AMBER' },
    { index: 3, ID: 'A3', Scale: 1, Pos: { x:0,y:0,z:0 }, Ang: { p:0,y:0,r:0 }, Color1: 'AMBER', Color2: 'AMBER' },
  ],
  selections: [
    { Name: 'Group1', Options: [
      { Name: 'Opt1', Auto: [1,2] },
      { Name: 'Opt2', Auto: [2,3] },
    ]},
    { Name: 'Group2', Options: [
      { Name: 'OptA', Auto: [3] },
    ]},
  ],
}

// Remove index 2 (A2)
const result = removeAutoAndAdjust(initial, 2)

// Autos should now be indices 1 and 2 (original 1 and 3), with 3 shifted to 2
assert(result.auto.length === 2, 'auto length becomes 2')
assert(result.auto[0].index === 1 && result.auto[0].ID === 'A1', 'first auto remains A1 at index 1')
assert(result.auto[1].index === 2 && result.auto[1].ID === 'A3', 'A3 shifts to index 2')

// Selections: all 2s removed, any 3s become 2s
const g1 = result.selections[0]
assert(g1.Options[0].Auto.join(',') === '1', 'Group1 Opt1 Auto becomes [1]')
assert(g1.Options[1].Auto.join(',') === '2', 'Group1 Opt2 Auto becomes [2] (3 -> 2)')

const g2 = result.selections[1]
assert(g2.Options[0].Auto.join(',') === '2', 'Group2 OptA Auto becomes [2] (3 -> 2)')

console.log('All removal tests passed.')
