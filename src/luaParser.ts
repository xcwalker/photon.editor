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
  Phase?: string;
};

export type SelectionOption = { Name: string; Auto: number[] };
export type Selection = { Name: string; Options: SelectionOption[] };

export type ParsedEMV = {
  auto: AutoItem[];
  selections: Selection[];
};

// Very lightweight parser tailored to the provided Lua structure.
// NOTE: This is not a general Lua parser; it extracts EMV.Auto and EMV.Selections blocks.
export function parseLuaForEMV(luaText: string): ParsedEMV {
  const autoBlock = extractBalancedAfter(luaText, 'EMV.Auto')
  const selectionsBlock = extractBalancedAfter(luaText, 'EMV.Selections')

  const auto = autoBlock ? parseAutoItems(autoBlock) : []
  const selections = selectionsBlock ? parseSelections(selectionsBlock) : []

  return { auto, selections }
}

function extractBlock(text: string, pattern: RegExp): string | null {
  const m = text.match(pattern)
  if (!m) return null
  return m[1]
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
      Color1: readStringField(objText, 'Color1'),
      Color2: readStringField(objText, 'Color2'),
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

export function serializeEMVAuto(auto: AutoItem[]): string {
  const lines: string[] = [];
  lines.push('EMV.Auto = {');
  auto.forEach((a, i) => {
    const fields: string[] = [];
    if (a.ID) fields.push(`ID = "${a.ID}"`);
    if (a.Scale !== undefined) fields.push(`Scale = ${a.Scale}`);
    if (a.Pos)
      fields.push(`Pos = Vector(${fmt(a.Pos.x)}, ${fmt(a.Pos.y)}, ${fmt(a.Pos.z)})`);
    if (a.Ang)
      fields.push(`Ang = Angle(${fmt(a.Ang.p)}, ${fmt(a.Ang.y)}, ${fmt(a.Ang.r)})`);
    if (a.Color1) fields.push(`Color1 = ${serializeColor(a.Color1)}`);
    if (a.Color2) fields.push(`Color2 = ${serializeColor(a.Color2)}`);
    if (a.Phase) fields.push(`Phase = "${a.Phase}"`);
    const comma = i < auto.length - 1 ? ',' : '';
    lines.push(`  { ${fields.join(', ')} }${comma}`);
  });
  lines.push('}');
  return lines.join('\n');
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function serializeColor(c: string): string {
  // If looks like constant (e.g., Color1), keep as-is; else quote
  if (/^[A-Z_]+$/.test(c)) return c;
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
