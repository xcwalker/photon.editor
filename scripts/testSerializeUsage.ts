import { serializeEMVAuto, type AutoItem, type Selection } from '../src/luaParser'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error('Assertion failed: ' + msg)
}

// Build sample autos and selections
const autos: AutoItem[] = [
  { index: 1, ID: 'Alpha' },
  { index: 2, ID: 'Beta' },
  { index: 3, ID: 'Gamma' },
]

const selections: Selection[] = [
  {
    Name: 'Group A',
    Options: [
      { Name: 'Opt 1', Auto: [1, 2] },
      { Name: 'Opt 2', Auto: [1] },
    ],
  },
  {
    Name: 'Group B',
    Options: [
      { Name: 'Blue', Auto: [2] },
      { Name: 'Green', Auto: [] },
    ],
  },
]

const out = serializeEMVAuto(autos, selections)
console.log(out)

// Check usage comments include selection and sub-group names
assert(out.includes('-- Used in selections: Group A (Opt 1, Opt 2)'), 'Auto 1 should list Group A with Opt 1, Opt 2')
assert(out.includes('-- Used in selections: Group A (Opt 1); Group B (Blue)'), 'Auto 2 should list Group A (Opt 1) and Group B (Blue)')
assert(out.includes('-- Not referenced in any selection'), 'Auto 3 should be marked as not referenced')

console.log('All serialize usage tests passed')
