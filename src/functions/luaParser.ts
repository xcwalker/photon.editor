export type Vec = { x: number; y: number; z: number };
export type Ang = { p: number; y: number; r: number };

export type AutoItem = {
  index: number;
  ID: string;
  Scale?: number;
  Pos?: Vec;
  Ang?: Ang;
  Color1?: string;
  Color2?: string;
  Color1Quoted?: boolean;
  Color2Quoted?: boolean;
  Phase?: string;
};

export type SelectionOption = { Name: string; Auto: number[] };
export type Selection = { Name: string; Options: SelectionOption[] };

export type ParsedEMV = {
  auto: AutoItem[];
  selections: Selection[];
  pi?: PI;
  lamps?: Lamp[];
  sequences?: Sequence[];
  sections?: Sections;
  patterns?: Patterns;
  lampsMeta?: LampsMeta;
};

// Very lightweight parser tailored to the provided Lua structure.
// NOTE: This is not a general Lua parser; it extracts EMV.Auto and EMV.Selections blocks.
export function parseLuaForEMV(luaText: string): ParsedEMV {
  const autoBlock = extractBalancedAfter(luaText, 'EMV.Auto')
  const selectionsBlock = extractBalancedAfter(luaText, 'EMV.Selections')
  const lampsBlock = extractBalancedAfter(luaText, 'EMV.Lamps')
  const sequencesBlock = extractBalancedAfter(luaText, 'EMV.Sequences')
  const sectionsBlock = extractBalancedAfter(luaText, 'EMV.Sections')
  const patternsBlock = extractBalancedAfter(luaText, 'EMV.Patterns')
  // Note: PI.States assignments are not inside a single balanced block; parse against the whole text

  const auto = autoBlock ? parseAutoItems(autoBlock) : []
  const selections = selectionsBlock ? parseSelections(selectionsBlock) : []
  let lamps: Lamp[] = []
  let lampsMeta: LampsMeta | undefined = undefined
  if (lampsBlock) {
    // Decide if this is dictionary-style lamps or array-style
    if (/\["[^"]+"\]\s*=\s*\{/.test(lampsBlock)) {
      lampsMeta = parseLampsMeta(lampsBlock)
    } else {
      lamps = parseLamps(lampsBlock)
    }
  }
  const sequences = sequencesBlock ? parseSequencesBlock(sequencesBlock) : []
  const sections = sectionsBlock ? parseSections(sectionsBlock) : undefined
  const patterns = patternsBlock ? parsePatterns(patternsBlock) : undefined
  const pi = parsePI(luaText)

  console.log({ lamps });

  return { auto, selections, pi, lamps, sequences, sections, patterns, lampsMeta }
}


function extractBalancedAfter(text: string, lhs: string): string | null {
  // Find the first occurrence of lhs followed by '=' and the opening '{'
  const start = text.indexOf(lhs)
  if (start < 0) return null
  const eqIdx = text.indexOf('=', start)
  if (eqIdx < 0) return null
  const braceStart = text.indexOf('{', eqIdx)
  if (braceStart < 0) return null
  // Walk and balance braces, ignoring braces inside quotes
  let depth = 0
  let i = braceStart
  let inString: false | '"' | "'" = false
  for (; i < text.length; i++) {
    const ch = text[i]
    const prev = text[i - 1]
    if (!inString && (ch === '"' || ch === "'")) {
      inString = ch as '"' | "'"
      continue
    }
    if (inString) {
      if (ch === inString && prev !== '\\') inString = false
      continue
    }
    if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) {
        // return inside braces without outer ones
        return text.slice(braceStart + 1, i)
      }
    }
  }
  return null
}

// -------------------- PI parsing/serialization --------------------
export type PIEntry = { index: number; color: string; value: number }
export type PIStates = Record<string, PIEntry[]>
export type PIVector = { x: number; y: number; z: number }
export type PIMetaEntry = {
  AngleOffset?: number
  W?: number
  H?: number
  Sprite?: string
  Scale?: number
  VisRadius?: number
  WMult?: number
}
export type PIMeta = Record<string, PIMetaEntry>
export type PIPositions = { [index: number]: { pos: PIVector; ang: { p: number; y: number; r: number }; name?: string } }
export type PI = { States: PIStates; Positions?: PIPositions; Meta?: PIMeta }

// -------------------- Lamps & Sequences --------------------
export type Lamp = {
  index: number
  ID?: string
  Pos?: Vec
  Ang?: Ang
  Color?: string
}

export type SequenceLight = { pos: Vec; ang: Ang; name?: string }
export type SequenceComponentsDict = Record<string, string>
export type SequenceComponentsArray = number[]
export type SequenceComponentsSection = SectionEntry[]
export type Sequence = {
  Group?: 'Sequences' | 'Traffic' | 'Illumination'
  Name: string
  Stage?: string
  Components?: SequenceComponentsDict | SequenceComponentsArray | SequenceComponentsSection
  Lights?: SequenceLight[]
  Disconnect?: number[]
}

// Sections/Patterns (as seen in example.lua)
export type SectionEntry = PIEntry
export type Sections = Record<string, SectionEntry[][]>
export type Patterns = Record<string, Record<string, number[]>>

// Lamps (dictionary style)
export type LampColor = { r: number; g: number; b: number; a?: number }
export type LampEntry = { Color?: LampColor; Texture?: string; Near?: number; FOV?: number; Distance?: number }
export type LampsMeta = Record<string, LampEntry>

function parseLamps(block: string): Lamp[] {
  const lamps: Lamp[] = []
  const objRegex = /\{\s*([\s\S]*?)\s*\}/g
  let match: RegExpExecArray | null
  let index = 1
  while ((match = objRegex.exec(block))) {
    const objText = match[1]
    const lamp: Lamp = {
      index,
      ID: readStringField(objText, 'ID'),
      Pos: readVector(objText, 'Pos'),
      Ang: readAngle(objText, 'Ang'),
      Color: (readStringOrIdentifierField(objText, 'Color') as string | undefined),
    }
    lamps.push(lamp)
    index++
  }
  return lamps
}

function parseSequencesBlock(block: string): Sequence[] {
  const result: Sequence[] = []
  // Detect subgroups: Sequences = { ... }, Traffic = { ... }, Illumination = { ... }
  const groupRegex = /(Sequences|Traffic|Illumination)\s*=\s*\{/g
  let gm: RegExpExecArray | null
  while ((gm = groupRegex.exec(block))) {
    const groupName = gm[1] as 'Sequences' | 'Traffic' | 'Illumination'
    const braceStart = groupRegex.lastIndex - 1
    const inner = extractBalancedFrom(block, braceStart) || ''
    const objs = extractTopLevelObjects(inner)
    for (const objText of objs) {
      const seq: Sequence = { Group: groupName, Name: readStringField(objText, 'Name') || 'Unnamed' }
      // Stage is a string like "M1", "L", etc.
      const stageStr = readStringField(objText, 'Stage')
      if (stageStr !== undefined) seq.Stage = stageStr
      // Components can be different shapes per group
      const compsStart = objText.search(/Components\s*=\s*\{/)
      if (compsStart >= 0) {
        const braceStartC = objText.indexOf('{', compsStart)
        const compsBody = braceStartC >= 0 ? extractBalancedFrom(objText, braceStartC) : null
        if (compsBody) {
          if (groupName === 'Illumination') {
            // Components are section entries like {index, COLOR, value}
            const entries: SectionEntry[] = []
            const entryR = /\{\s*(\d+)\s*,\s*(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\}/g
            let em: RegExpExecArray | null
            while ((em = entryR.exec(compsBody))) {
              const idx = parseInt(em[1], 10)
              const color = (em[2] ?? em[3])
              const value = parseFloat(em[4])
              if (!Number.isNaN(idx) && !Number.isNaN(value)) entries.push({ index: idx, color: color!, value })
            }
            if (entries.length) seq.Components = entries
          } else {
            // For Sequences/Traffic, Components is a dict: ["group"] = "pattern"
            const dict: SequenceComponentsDict = {}
            const dictR = /\["([^"]+)"\]\s*=\s*"([^"]*)"/g
            let dm: RegExpExecArray | null
            while ((dm = dictR.exec(compsBody))) {
              dict[dm[1]] = dm[2]
            }
            // If empty, try numeric array fallback
            if (Object.keys(dict).length) {
              seq.Components = dict
            } else {
              const nums = compsBody
                .split(/[\s,]+/)
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !Number.isNaN(n))
              if (nums.length) seq.Components = nums
            }
          }
        }
      }
      // Lights (Illumination only)
      const lightsStart = objText.search(/Lights\s*=\s*\{/)
      if (lightsStart >= 0) {
        const braceStartL = objText.indexOf('{', lightsStart)
        const lightsBody = braceStartL >= 0 ? extractBalancedFrom(objText, braceStartL) : null
        if (lightsBody) {
          const lights: SequenceLight[] = []
          const lr = /\{\s*Vector\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*,\s*Angle\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*(?:,\s*"([^"]+)")?\s*\}/g
          let lm: RegExpExecArray | null
          while ((lm = lr.exec(lightsBody))) {
            const pos: Vec = { x: parseFloat(lm[1]), y: parseFloat(lm[2]), z: parseFloat(lm[3]) }
            const ang: Ang = { p: parseFloat(lm[4]), y: parseFloat(lm[5]), r: parseFloat(lm[6]) }
            const name = lm[7]
            lights.push({ pos, ang, name })
          }
          if (lights.length) seq.Lights = lights
        }
      }
      // Disconnect numbers
      const discMatch = /Disconnect\s*=\s*\{([\s\S]*?)\}/.exec(objText)
      if (discMatch) {
        const nums = discMatch[1]
          .split(/[\s,]+/)
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !Number.isNaN(n))
        seq.Disconnect = nums
      }
      result.push(seq)
    }
  }
  return result
}

function parseSections(block: string): Sections {
  const sections: Sections = {}
  const nameRegex = /\["([^"]+)"\]\s*=\s*\{/g
  let m: RegExpExecArray | null
  while ((m = nameRegex.exec(block))) {
    const name = m[1]
    const braceStart = nameRegex.lastIndex - 1
    const inner = extractBalancedFrom(block, braceStart) || ''
    const stageList: SectionEntry[][] = []
    const stageRegex = /\{\s*([\s\S]*?)\s*\}/g
    let sm: RegExpExecArray | null
    while ((sm = stageRegex.exec(inner))) {
      const stageText = sm[1]
      const entries: SectionEntry[] = []
      const entryR = /\{\s*(\d+)\s*,\s*(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\}/g
      let em: RegExpExecArray | null
      while ((em = entryR.exec(stageText))) {
        const idx = parseInt(em[1], 10)
        const color = (em[2] ?? em[3])
        const value = parseFloat(em[4])
        if (!Number.isNaN(idx) && !Number.isNaN(value)) entries.push({ index: idx, color: color!, value })
      }
      if (entries.length) stageList.push(entries)
    }
    sections[name] = stageList
  }
  return sections
}

function parsePatterns(block: string): Patterns {
  const patterns: Patterns = {}
  const groupRegex = /\["([^"]+)"\]\s*=\s*\{/g
  let gm: RegExpExecArray | null
  while ((gm = groupRegex.exec(block))) {
    const group = gm[1]
    const braceStart = groupRegex.lastIndex - 1
    const inner = extractBalancedFrom(block, braceStart) || ''
    const dict: Record<string, number[]> = {}
    const patRegex = /\["([^"]+)"\]\s*=\s*\{\s*([\s\S]*?)\s*\}/g
    let pm: RegExpExecArray | null
    while ((pm = patRegex.exec(inner))) {
      const patName = pm[1]
      const nums = pm[2]
        .split(/[\s,]+/)
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n))
      dict[patName] = nums
    }
    patterns[group] = dict
  }
  return patterns
}

export function serializeEMVSections(sections: Sections): string {
  const lines: string[] = []
  lines.push('EMV.Sections = {')
  const names = Object.keys(sections)
  names.forEach((name, i) => {
    const stages = sections[name]
    const stageStr = stages
      .map((entries) => '{ ' + entries.map((e) => `{${e.index}, ${e.color}, ${fmt(e.value)}}`).join(', ') + ' }')
      .join(', ')
    const comma = i < names.length - 1 ? ',' : ''
    lines.push(`  ["${name}"] = { ${stageStr} }${comma}`)
  })
  lines.push('}')
  return lines.join('\n')

}

export function serializeEMVPatterns(patterns: Patterns): string {
  const lines: string[] = []
  lines.push('EMV.Patterns = {')
  const groups = Object.keys(patterns)
  groups.forEach((group, gi) => {
    const dict = patterns[group]
    const parts = Object.entries(dict).map(([name, nums]) => `  ["${name}"] = { ${nums.join(', ')} }`)
    const inner = ['{', ...parts, '}'].join('\n')
    const comma = gi < groups.length - 1 ? ',' : ''
    lines.push(`  ["${group}"] = ${inner}${comma}`)
  })
  lines.push('}')
  return lines.join('\n')
}

export function serializeEMVLamps(lamps: Lamp[]): string {
  const lines: string[] = []
  lines.push('EMV.Lamps = {')
  lamps.forEach((l, i) => {
    const fields: string[] = []
    if (l.ID) fields.push(`ID = "${l.ID}"`)
    if (l.Pos) fields.push(`Pos = Vector(${fmt(l.Pos.x)}, ${fmt(l.Pos.y)}, ${fmt(l.Pos.z)})`)
    if (l.Ang) fields.push(`Ang = Angle(${fmt(l.Ang.p)}, ${fmt(l.Ang.y)}, ${fmt(l.Ang.r)})`)
    if (l.Color) fields.push(`Color = ${/^[A-Za-z_][A-Za-z0-9_]*$/.test(l.Color) ? l.Color : `"${l.Color}"`}`)
    const comma = i < lamps.length - 1 ? ',' : ''
    lines.push(`  { ${fields.join(', ')} }${comma}`)
  })
  lines.push('}')
  return lines.join('\n')
}

export function serializeEMVLampsMeta(lamps: LampsMeta): string {
  const lines: string[] = []
  lines.push('EMV.Lamps = {')
  const names = Object.keys(lamps)
  names.forEach((name, i) => {
    const entry = lamps[name]
    const fields: string[] = []
    if (entry.Color) {
      const c = entry.Color
      const rgba = c.a !== undefined ? `${fmt(c.r)}, ${fmt(c.g)}, ${fmt(c.b)}, ${fmt(c.a)}` : `${fmt(c.r)}, ${fmt(c.g)}, ${fmt(c.b)}`
      fields.push(`Color = Color(${rgba})`)
    }
    if (entry.Texture) fields.push(`Texture = "${entry.Texture}"`)
    if (entry.Near !== undefined) fields.push(`Near = ${fmt(entry.Near)}`)
    if (entry.FOV !== undefined) fields.push(`FOV = ${fmt(entry.FOV)}`)
    if (entry.Distance !== undefined) fields.push(`Distance = ${fmt(entry.Distance)}`)
    const comma = i < names.length - 1 ? ',' : ''
    lines.push(`  ["${name}"] = { ${fields.join(', ')} }${comma}`)
  })
  lines.push('}')
  return lines.join('\n')
}

export function serializeEMVSequences(sequences: Sequence[]): string {
  const lines: string[] = []
  lines.push('EMV.Sequences = {')
  const byGroup: Record<string, Sequence[]> = { Sequences: [], Traffic: [], Illumination: [] }
  sequences.forEach((s) => {
    const g = s.Group ?? 'Sequences'
    if (!byGroup[g]) byGroup[g] = []
    byGroup[g].push(s)
  })
  const groupOrder: Array<'Sequences' | 'Traffic' | 'Illumination'> = ['Sequences', 'Traffic', 'Illumination']
  groupOrder.forEach((groupName, gi) => {
    const groupSeqs = byGroup[groupName] || []
    const inner: string[] = []
    groupSeqs.forEach((s, si) => {
      const fields: string[] = []
      fields.push(`Name = "${s.Name}"`)
      if (s.Stage !== undefined) fields.push(`Stage = "${s.Stage}"`)
      // Components
      if (s.Components) {
        if (groupName === 'Illumination' && Array.isArray(s.Components)) {
          const entries = (s.Components as SequenceComponentsSection)
          const compsStr = entries.map((e) => `{${e.index}, ${e.color}, ${fmt(e.value)}}`).join(', ')
          fields.push(`Components = {${compsStr}}`)
        } else if (!Array.isArray(s.Components)) {
          const dict = s.Components as SequenceComponentsDict
          const parts = Object.entries(dict).map(([k, v]) => `["${k}"] = "${v}"`)
          fields.push(`Components = {${parts.join(', ')}}`)
        } else {
          const arr = s.Components as SequenceComponentsArray
          fields.push(`Components = {${arr.join(', ')}}`)
        }
      } else {
        // Ensure Components key exists for Traffic items even if empty
        if (groupName === 'Traffic') fields.push('Components = {}')
      }
      // Lights (Illumination)
      if (groupName === 'Illumination' && s.Lights && s.Lights.length) {
        const lightsStr = s.Lights
          .map((l) => {
            const p = l.pos
            const a = l.ang
            const nm = l.name ? `, "${l.name}"` : ''
            return `{Vector(${fmt(p.x)}, ${fmt(p.y)}, ${fmt(p.z)}), Angle(${fmt(a.p)}, ${fmt(a.y)}, ${fmt(a.r)})${nm}}`
          })
          .join(', ')
        fields.push(`Lights = {${lightsStr}}`)
      }
      // Disconnect
      if (s.Disconnect) {
        fields.push(`Disconnect = {${s.Disconnect.join(', ')}}`)
      } else {
        fields.push('Disconnect = {}')
      }
      const comma = si < groupSeqs.length - 1 ? ',' : ''
      inner.push(`    { ${fields.join(', ')} }${comma}`)
    })
    const commaGroup = gi < groupOrder.length - 1 ? ',' : ''
    lines.push(`  ${groupName} = {`)
    if (inner.length) {
      lines.push(inner.join('\n'))
    }
    lines.push(`  }${commaGroup}`)
  })
  lines.push('}')
  return lines.join('\n')
}

function parseLampsMeta(block: string): LampsMeta {
  const lamps: LampsMeta = {}
  const nameRegex = /\["([^"]+)"\]\s*=\s*\{/g
  let m: RegExpExecArray | null
  while ((m = nameRegex.exec(block))) {
    const name = m[1]
    const braceStart = nameRegex.lastIndex - 1
    const inner = extractBalancedFrom(block, braceStart) || ''
    const entry: LampEntry = {}
    // Color = Color(r, g, b[, a])
  const colorMatch = /Color\s*=\s*Color\(\s*([0-9.+-]+)\s*,\s*([0-9.+-]+)\s*,\s*([0-9.+-]+)(?:\s*,\s*([0-9.+-]+))?\s*\)/.exec(inner)
    if (colorMatch) {
      const r = parseFloat(colorMatch[1])
      const g = parseFloat(colorMatch[2])
      const b = parseFloat(colorMatch[3])
      const a = colorMatch[4] !== undefined ? parseFloat(colorMatch[4]) : undefined
      entry.Color = { r, g, b, a }
    }
    // Texture = "..."
    const texMatch = /Texture\s*=\s*"([^"]*)"/.exec(inner)
    if (texMatch) entry.Texture = texMatch[1]
    // Near/FOV/Distance numbers
    const numField = (field: string) => {
      const r = new RegExp(`${field}\\s*=\\s*([0-9]+(?:\\.[0-9]+)?)`)
      const mm = r.exec(inner)
      return mm ? parseFloat(mm[1]) : undefined
    }
    entry.Near = numField('Near')
    entry.FOV = numField('FOV')
    entry.Distance = numField('Distance')
    lamps[name] = entry
  }
  return lamps
}

function parsePI(block: string): PI {
  // Expect a balanced body containing lines like:
  // PI.States = {}
  // PI.States.Headlights = {}
  // PI.States.Brakes = {{9, R, 2}, {10, R, 2}}
  const states: PIStates = {}
  // 1) Match separate assignments: PI.States.<Name> = { ... }
  const separate = /PI\.States\.([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{/g
  let m: RegExpExecArray | null
  while ((m = separate.exec(block))) {
    const name = m[1]
    // Balanced extract the inner of this assignment
    const braceStart = separate.lastIndex - 1
    const inner = extractBalancedFrom(block, braceStart) ?? ''
    const entries: PIEntry[] = []
    // Match entries like {9, R, 2} or {10, "WHITE", 1.5}
    const t = /\{\s*(\d+)\s*,\s*(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\}/g
    let tm: RegExpExecArray | null
    while ((tm = t.exec(inner))) {
      const idx = parseInt(tm[1].trim(), 10)
      const color = (tm[2] ?? tm[3]).trim()
      const val = parseFloat(tm[4].trim())
      if (!Number.isNaN(idx) && !Number.isNaN(val)) {
        entries.push({ index: idx, color, value: val })
      }
    }
    states[name] = entries
  }
  // 2) If PI.States is a single table with entries like Name = { ... }
  const statesBlock = extractBalancedAfter(block, 'PI.States')
  if (statesBlock) {
    // More robust scan: find each `<Name> = { ... }` by locating the balanced braces
    const nameRegex = /([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{/g
    let nm: RegExpExecArray | null
    while ((nm = nameRegex.exec(statesBlock))) {
      const name = nm[1]
      const braceStart = nameRegex.lastIndex - 1 // points at the '{' matched
      const inner = extractBalancedFrom(statesBlock, braceStart)
      const entries: PIEntry[] = []
      if (inner) {
  const t = /\{\s*(\d+)\s*,\s*(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\}/g
        let tm: RegExpExecArray | null
        while ((tm = t.exec(inner))) {
          const idx = parseInt(tm[1].trim(), 10)
          const color = (tm[2] ?? tm[3]).trim()
          const val = parseFloat(tm[4].trim())
          if (!Number.isNaN(idx) && !Number.isNaN(val)) {
            entries.push({ index: idx, color, value: val })
          }
        }
      }
      states[name] = entries
    }
  }
  const positionsBlock = extractBalancedAfter(block, 'PI.Positions')
  let positions: PIPositions | undefined = positionsBlock ? parsePIPositions(positionsBlock) : undefined
  // Also support separate assignments style: PI.Positions[12] = { Vector(...), Angle(...), "name" }
  const posSeparate = /PI\.Positions\[\s*(\d+)\s*\]\s*=\s*\{\s*Vector\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*,\s*Angle\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*(?:,\s*"([^"]+)")?\s*\}/g
  let pm: RegExpExecArray | null
  while ((pm = posSeparate.exec(block))) {
    const idx = parseInt(pm[1], 10)
    const pos: PIVector = { x: parseFloat(pm[2]), y: parseFloat(pm[3]), z: parseFloat(pm[4]) }
    const ang = { p: parseFloat(pm[5]), y: parseFloat(pm[6]), r: parseFloat(pm[7]) }
    const name = pm[8]
    if (!positions) positions = {}
    positions[idx] = { pos, ang, name }
  }
  // Parse PI.Meta block if present
  const metaBlock = extractBalancedAfter(block, 'PI.Meta')
  const meta: PIMeta | undefined = metaBlock ? parsePIMeta(metaBlock) : undefined
  return { States: states, Positions: positions, Meta: meta }
}

export function serializePI(pi: PI): string {
  const lines: string[] = []
  // Meta first (optional)
  if (pi.Meta && Object.keys(pi.Meta).length) {
    lines.push('PI.Meta = {')
    Object.entries(pi.Meta).forEach(([name, m]) => {
      const fields: string[] = []
      if (m.AngleOffset !== undefined) fields.push(`AngleOffset = ${fmt(m.AngleOffset)}`)
      if (m.W !== undefined) fields.push(`W = ${fmt(m.W)}`)
      if (m.H !== undefined) fields.push(`H = ${fmt(m.H)}`)
      if (m.Sprite) fields.push(`Sprite = "${m.Sprite}"`)
      if (m.Scale !== undefined) fields.push(`Scale = ${fmt(m.Scale)}`)
      if (m.VisRadius !== undefined) fields.push(`VisRadius = ${fmt(m.VisRadius)}`)
      if (m.WMult !== undefined) fields.push(`WMult = ${fmt(m.WMult)}`)
      lines.push(`  ${name} = { ${fields.join(', ')} }`) 
    })
    lines.push('}')
    lines.push('')
  }
  lines.push('PI.States = {}')
  const names = Object.keys(pi.States)
  names.forEach((name) => {
    const entries = pi.States[name] ?? []
    const inner = entries
      .map((e) => `{${e.index}, ${e.color}, ${fmt(e.value)}}`)
      .join(', ')
    lines.push(`PI.States.${name} = {${inner}}`)
  })
  if (pi.Positions) {
    lines.push('')
    lines.push('PI.Positions = {}')
    Object.entries(pi.Positions).forEach(([idx, entry]) => {
      const p = entry.pos
      const a = entry.ang
      const nm = entry.name ? `, "${entry.name}"` : ''
      lines.push(`PI.Positions[${idx}] = {Vector(${fmt(p.x)}, ${fmt(p.y)}, ${fmt(p.z)}), Angle(${fmt(a.p)}, ${fmt(a.y)}, ${fmt(a.r)})${nm}}`)
    })
  }
  return lines.join('\n')
}

function parsePIMeta(block: string): PIMeta {
  const meta: PIMeta = {}
  // Scan entries like: name = { AngleOffset = -90, W = 12, H = 12, Sprite = "sprites/emv/blank", Scale = 3, VisRadius = 16, WMult = 1.2 }
  const nameRegex = /([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{/g
  let m: RegExpExecArray | null
  while ((m = nameRegex.exec(block))) {
    const name = m[1]
    const braceStart = nameRegex.lastIndex - 1
    const inner = extractBalancedFrom(block, braceStart)
    const entry: PIMetaEntry = {}
    if (inner) {
      const numField = (field: string) => {
        const r = new RegExp(`${field}\\s*=\\s*([0-9]+(?:\\.[0-9]+)?)`)
        const mm = r.exec(inner)
        return mm ? parseFloat(mm[1]) : undefined
      }
      const strField = (field: string) => {
        const r = new RegExp(`${field}\\s*=\\s*"([^"]*)"`)
        const mm = r.exec(inner)
        return mm ? mm[1] : undefined
      }
      entry.AngleOffset = numField('AngleOffset')
      entry.W = numField('W')
      entry.H = numField('H')
      entry.Sprite = strField('Sprite')
      entry.Scale = numField('Scale')
      entry.VisRadius = numField('VisRadius')
      entry.WMult = numField('WMult')
    }
    meta[name] = entry
  }
  return meta
}

function parsePIPositions(block: string): PIPositions {
  const positions: PIPositions = {}
  // Match entries like: [9] = {Vector(42.8, 125.25, 44.2), Angle(0, 0, 0), "side"}
  const r = /\[\s*(\d+)\s*\]\s*=\s*\{\s*Vector\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*,\s*Angle\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*(?:,\s*"([^"]+)")?\s*\}/g
  let m: RegExpExecArray | null
  while ((m = r.exec(block))) {
    const idx = parseInt(m[1], 10)
    const pos: PIVector = { x: parseFloat(m[2]), y: parseFloat(m[3]), z: parseFloat(m[4]) }
    const ang = { p: parseFloat(m[5]), y: parseFloat(m[6]), r: parseFloat(m[7]) }
    const name = m[8]
    positions[idx] = { pos, ang, name }
  }
  return positions
}

function parseAutoItems(block: string): AutoItem[] {
  // Split top-level items: sequences of { ... }
  const items: AutoItem[] = [];
  const objRegex = /\{\s*([\s\S]*?)\s*\}/g;
  let match: RegExpExecArray | null;
  let index = 1;
  while ((match = objRegex.exec(block))) {
    const objText = match[1];
    const item: AutoItem = {
      index,
      ID: readStringField(objText, 'ID') || '',
      Scale: readNumberField(objText, 'Scale'),
      Pos: readVector(objText, 'Pos'),
      Ang: readAngle(objText, 'Ang'),
      // Support local identifiers (e.g., Color1, Color2) or quoted strings
      ...(() => {
        const c1 = readStringOrIdentifierField(objText, 'Color1', true) as { value: string; quoted: boolean } | undefined
        const c2 = readStringOrIdentifierField(objText, 'Color2', true) as { value: string; quoted: boolean } | undefined
        return {
          Color1: c1?.value,
          Color1Quoted: c1?.quoted,
          Color2: c2?.value,
          Color2Quoted: c2?.quoted,
        }
      })(),
      Phase: readStringField(objText, 'Phase'),
    };
    items.push(item);
    index++;
  }
  return items;
}

function parseSelections(block: string): Selection[] {
  const selections: Selection[] = []
  // Extract each top-level selection object by balancing braces
  const objects = extractTopLevelObjects(block)
  for (const objText of objects) {
    const name = readStringField(objText, 'Name') || 'Unnamed'
    // Find Options block start after 'Options = {'
    const optKeyIdx = objText.search(/Options\s*=\s*\{/)
    let options: SelectionOption[] = []
    if (optKeyIdx >= 0) {
      const braceStart = objText.indexOf('{', optKeyIdx)
      const optionsBody = braceStart >= 0 ? extractBalancedFrom(objText, braceStart) : null
      options = optionsBody ? parseOptions(optionsBody) : []
    }
    selections.push({ Name: name, Options: options })
  }
  return selections
}

function extractTopLevelObjects(block: string): string[] {
  const result: string[] = []
  let i = 0
  while (i < block.length) {
    const braceStart = block.indexOf('{', i)
    if (braceStart < 0) break
    const objBody = extractBalancedFrom(block, braceStart)
    if (!objBody) break
    result.push(objBody)
    i = braceStart + objBody.length + 2 // skip past the closing brace
  }
  return result
}

function extractBalancedFrom(text: string, braceStart: number): string | null {
  let depth = 0
  let i = braceStart
  let inString: false | '"' | "'" = false
  for (; i < text.length; i++) {
    const ch = text[i]
    const prev = text[i - 1]
    if (!inString && (ch === '"' || ch === "'")) {
      inString = ch as '"' | "'"
      continue
    }
    if (inString) {
      if (ch === inString && prev !== '\\') inString = false
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(braceStart + 1, i)
    }
  }
  return null
}

function parseOptions(optionsText: string): SelectionOption[] {
  const options: SelectionOption[] = []
  // Options are objects with Name and Auto list
  const optRegex = /\{[\s\S]*?Name\s*=\s*"([^"]+)"[\s\S]*?Auto\s*=\s*\{([\s\S]*?)\}[\s\S]*?\}/g
  let o: RegExpExecArray | null
  while ((o = optRegex.exec(optionsText))) {
    const optName = o[1]
    const autoListText = o[2]
    const autoNums = autoListText
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseInt(s, 10))
      .filter((n) => !Number.isNaN(n))
    options.push({ Name: optName, Auto: autoNums })
  }
  return options
}

function readStringField(objText: string, field: string): string | undefined {
  const r = new RegExp(`${field}\\s*=\\s*"([^"]*)"`);
  const m = objText.match(r);
  return m ? m[1] : undefined;
}

// Reads either a quoted string value or an unquoted identifier (variable/constant)
// Examples it should parse:
//   Color1 = Color1
//   Color1 = "WHITE"
// Returns the raw identifier (e.g., Color1) or the inner string (e.g., WHITE)
function readStringOrIdentifierField(objText: string, field: string, withQuotedFlag?: boolean): { value: string; quoted: boolean } | string | undefined {
  // Try quoted string first
  const quoted = new RegExp(`${field}\\s*=\\s*"([^"]*)"`).exec(objText)
  if (quoted) return withQuotedFlag ? { value: quoted[1], quoted: true } : quoted[1]
  // Then unquoted identifier: starts with letter or underscore, followed by letters, digits, or underscores
  const ident = new RegExp(`${field}\\s*=\\s*([A-Za-z_][A-Za-z0-9_]*)`).exec(objText)
  if (ident) return withQuotedFlag ? { value: ident[1], quoted: false } : ident[1]
  return undefined
}

function readNumberField(objText: string, field: string): number | undefined {
  const r = new RegExp(`${field}\\s*=\\s*([0-9]+(?:\\.[0-9]+)?)`);
  const m = objText.match(r);
  return m ? parseFloat(m[1]) : undefined;
}

function readVector(objText: string, field: string): Vec | undefined {
  const r = new RegExp(`${field}\\s*=\\s*Vector\\(\\s*([^,]+)\\s*,\\s*([^,]+)\\s*,\\s*([^\\)]+)\\s*\\)`);
  const m = objText.match(r);
  if (!m) return undefined;
  return { x: parseFloat(m[1]), y: parseFloat(m[2]), z: parseFloat(m[3]) };
}

function readAngle(objText: string, field: string): Ang | undefined {
  const r = new RegExp(`${field}\\s*=\\s*Angle\\(\\s*([^,]+)\\s*,\\s*([^,]+)\\s*,\\s*([^\\)]+)\\s*\\)`);
  const m = objText.match(r);
  if (!m) return undefined;
  return { p: parseFloat(m[1]), y: parseFloat(m[2]), r: parseFloat(m[3]) };
}

export function serializeEMVAuto(auto: AutoItem[], selections?: Selection[]): string {
  const lines: string[] = []
  lines.push('EMV.Auto = {')

  // Build usage map: auto index -> selection name -> set of option(sub-group) names
  const usage = new Map<number, Map<string, Set<string>>>()
  if (selections && selections.length) {
    selections.forEach((sel) => {
      const selName = sel.Name || '(unnamed)'
      sel.Options.forEach((opt) => {
        opt.Auto.forEach((idx) => {
          const bySel = usage.get(idx) ?? new Map<string, Set<string>>()
          const optSet = bySel.get(selName) ?? new Set<string>()
          optSet.add(opt.Name || '(unnamed option)')
          bySel.set(selName, optSet)
          usage.set(idx, bySel)
        })
      })
    })
  }

  auto.forEach((a, i) => {
    const fields: string[] = []
    if (a.ID) fields.push(`ID = "${a.ID}"`)
    if (a.Scale !== undefined) fields.push(`Scale = ${a.Scale}`)
    if (a.Pos)
      fields.push(`Pos = Vector(${fmt(a.Pos.x)}, ${fmt(a.Pos.y)}, ${fmt(a.Pos.z)})`)
    if (a.Ang)
      fields.push(`Ang = Angle(${fmt(a.Ang.p)}, ${fmt(a.Ang.y)}, ${fmt(a.Ang.r)})`)
  if (a.Color1) fields.push(`Color1 = ${serializeColor(a.Color1, a.Color1Quoted)}`)
  if (a.Color2) fields.push(`Color2 = ${serializeColor(a.Color2, a.Color2Quoted)}`)
    if (a.Phase) fields.push(`Phase = "${a.Phase}"`)

    const comma = i < auto.length - 1 ? ',' : ''

    // Optional usage comment line before the item
    const usedBy = usage.get(a.index)
    if (usedBy && usedBy.size) {
      // Build label: Group (Option1, Option2); Group2 (OptionA)
      const parts: string[] = []
      Array.from(usedBy.entries()).forEach(([group, opts]) => {
        const optList = Array.from(opts.values()).join(', ')
        parts.push(`${group} (${optList})`)
      })
      lines.push(`  -- Used in selections: ${parts.join('; ')}`)
    } else if (selections) {
      lines.push('  -- Not referenced in any selection')
    }

    lines.push(`  { ${fields.join(', ')} }${comma}`)
  })
  lines.push('}')
  return lines.join('\n')
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function serializeColor(c: string, quoted?: boolean): string {
  // Preserve original quoting intent: if parsed from quotes, keep quotes
  if (quoted) return `"${c}"`
  // Otherwise, if it's a valid Lua identifier (e.g., Color1, Color2), emit unquoted
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(c)) return c;
  // Fallback to quoted
  return `"${c}"`;
}

export function serializeEMVSelections(selections: Selection[]): string {
  const lines: string[] = []
  lines.push('EMV.Selections = {')
  selections.forEach((sel, si) => {
    lines.push('  {')
    lines.push(`    Name = "${sel.Name}",`)
    lines.push('    Options = {')
    sel.Options.forEach((opt, oi) => {
      const autoList = opt.Auto.join(', ')
      const comma = oi < sel.Options.length - 1 ? ',' : ''
      lines.push(`      {`)
      lines.push(`        Name = "${opt.Name}",`)
      lines.push(`        Auto = {${autoList}}`)
      lines.push(`      }${comma}`)
    })
    lines.push('    }')
    const commaSel = si < selections.length - 1 ? ',' : ''
    lines.push(`  }${commaSel}`)
  })
  lines.push('}')
  return lines.join('\n')
}
