import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Splits ui/src/lib/excelGenerator.ts into modules under
 * src/main/docs/excel/.
 *
 * Every section body is copied byte for byte. Names a body needs are
 * reintroduced above it — derived values by destructuring the context, the
 * cross-section counters as `let` bindings, per-workbook image handles as
 * locals — so no line inside a body changes. That is the point: this file is
 * the product, and hand-editing 8,000 lines of cell arithmetic is exactly how a
 * printed invoice silently changes.
 *
 * Re-run with `npm run docs:split` after changing the source generator.
 */

const SRC = new URL('../../ui/src/lib/excelGenerator.ts', import.meta.url).pathname.replace(
  /^\//,
  ''
)
const OUT = new URL('../src/main/docs/excel/', import.meta.url).pathname.replace(/^\//, '')

const lines = readFileSync(SRC, 'utf8').split('\n')
const slice = (from, to) => lines.slice(from - 1, to).join('\n')

/** Declared inside section 1, used by later sections. Moved to the context. */
const SHARED_CONST = [
  'headerUrl',
  'footerUrl',
  'signatureUrl',
  'configurePrintSheet',
  'setGlobalFontSize',
  'pixelToExcelWidth',
  'columnWidths',
  'setOuterBorder'
]

/**
 * Image handles are per-workbook: each sheet calls its own
 * `<workbook>.addImage(...)` and reassigns these, so they are locals, exactly
 * as the original `let vgnHeader;` was.
 */
const IMAGE_LOCALS = [
  'vgnHeader',
  'vgnFooter',
  'signature',
  'vgnHeaderW',
  'vgnHeaderH',
  'vgnFooterW',
  'vgnFooterH',
  'vgnSignatureW',
  'vgnSignatureH'
]

/** Counters the sections hand to each other. */
// MAX_WIDTH looks like a constant but every sheet reassigns it, so it travels
// with the counters rather than the context.
const CARRY = ['srNo', 'row', 'hsnCode', 'allProductsType', 'skipRow', 'addSkipRow', 'MAX_WIDTH']

const SECTIONS = [
  { id: 'customInvoice', fn: 'buildCustomInvoice', from: 379, to: 2275, workbook: 'workbook', sheet: 'worksheet' },
  { id: 'worksheetCopy', fn: 'buildWorksheetCopy', from: 2276, to: 4109, workbook: 'customInvoiceCopyWorkbook', sheet: 'worksheetCopy' },
  { id: 'packingList', fn: 'buildPackingList', from: 4110, to: 4847, workbook: 'packingListWorkbook', sheet: 'packingList' },
  { id: 'annexure', fn: 'buildAnnexure', from: 4848, to: 5492, workbook: 'annexureWorkbook', sheet: 'annexure' },
  { id: 'vgm', fn: 'buildVgm', from: 5493, to: 6077, workbook: 'vgnWorkbook', sheet: 'vgn' },
  { id: 'ci', fn: 'buildCustomerInvoice', from: 6078, to: 7535, workbook: 'customerInvoiceWorkbook', sheet: 'customerInvoice' },
  { id: 'pl', fn: 'buildPackingListCopy', from: 7536, to: 8199, workbook: 'pLWorkbook', sheet: 'pl' }
]

const preludeBody = slice(125, 378)

/**
 * Top-level declarations, including destructuring patterns —
 * `let [totalPackages, unitOfIt] = packageInfo.split(' ')` binds two names that
 * a single-identifier pattern would miss, and missing one shows up as a
 * ReferenceError only once that sheet runs.
 */
const declaredTopLevel = (text) => {
  const names = new Set()
  const simple = /^ {4}(?:let|const|var)\s+([A-Za-z_$][\w$]*)/gm
  const destructured = /^ {4}(?:let|const|var)\s+([[{])([^\]}]*)[\]}]/gm

  let match
  while ((match = simple.exec(text))) names.add(match[1])
  while ((match = destructured.exec(text))) {
    for (const part of match[2].split(',')) {
      const name = part.split(':').pop().split('=')[0].trim().replace(/^\.\.\./, '')
      if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name)
    }
  }
  return [...names]
}

const declaresName = (text, name) => declaredTopLevel(text).includes(name)

const usesName = (text, name) => {
  const escaped = name.replace(/\$/g, '\\$')
  return new RegExp('(^|[^\\w$.])' + escaped + '\\b').test(text)
}

const contextNames = declaredTopLevel(preludeBody)

/* ------------------------------------------------------------------ *
 * Hoist shared declarations out of section 1
 * ------------------------------------------------------------------ */

/** Blanks comments and string bodies so brace counting is not fooled by them. */
const mask = (text) => {
  const out = text.split('')
  let i = 0
  while (i < text.length) {
    const two = text.slice(i, i + 2)
    if (two === '//') {
      while (i < text.length && text[i] !== '\n') out[i++] = ' '
      continue
    }
    if (two === '/*') {
      while (i < text.length && text.slice(i, i + 2) !== '*/') {
        if (text[i] !== '\n') out[i] = ' '
        i++
      }
      out[i] = ' '
      out[i + 1] = ' '
      i += 2
      continue
    }
    const ch = text[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      out[i++] = ' '
      while (i < text.length && !(text[i] === ch && text[i - 1] !== '\\')) {
        if (text[i] !== '\n') out[i] = ' '
        i++
      }
      out[i++] = ' '
      continue
    }
    i++
  }
  return out.join('')
}

const extractDeclaration = (text, name) => {
  const masked = mask(text)
  const start = masked.search(new RegExp('^ {4}(?:let|const|var)\\s+' + name + '\\b', 'm'))
  if (start === -1) return { text, taken: null }

  let depth = 0
  for (let i = start; i < masked.length; i++) {
    const ch = masked[i]
    if (ch === '(' || ch === '{' || ch === '[') depth++
    else if (ch === ')' || ch === '}' || ch === ']') depth--
    else if (ch === ';' && depth === 0) {
      return { text: text.slice(0, start) + text.slice(i + 1), taken: text.slice(start, i + 1) }
    }
  }
  return { text, taken: null }
}

let section1Body = slice(SECTIONS[0].from, SECTIONS[0].to)
const hoisted = []

for (const name of [...SHARED_CONST, ...IMAGE_LOCALS]) {
  const result = extractDeclaration(section1Body, name)
  if (!result.taken) {
    console.warn(`!! could not extract ${name}`)
    continue
  }
  section1Body = result.text
  if (SHARED_CONST.includes(name)) hoisted.push(result.taken.trim())
}

/* ------------------------------------------------------------------ *
 * Emit
 * ------------------------------------------------------------------ */

mkdirSync(join(OUT, 'sheets'), { recursive: true })

const banner = (extra) =>
  [
    '/* eslint-disable */',
    '// @ts-nocheck',
    '// GENERATED by scripts/split-generator.mjs from ui/src/lib/excelGenerator.ts.',
    '// The body below is a verbatim copy. Do not edit or reformat it by hand —',
    '// re-run `npm run docs:split` instead. The original was written with',
    '// TypeScript strictness disabled, so it is excluded from type checking;',
    '// correctness is established by scripts/compare-generators.mts, which diffs',
    '// every cell against the original generator.',
    extra
  ]
    .filter(Boolean)
    .join('\n')

writeFileSync(
  join(OUT, 'context.ts'),
  `${banner('')}

import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { convertNamesToInitials, formatNames, round3 } from './helpers'
import type { LegacyInvoiceData, LoadedImage } from './types'

void ExcelJS
void format
void round3
void convertNamesToInitials
void formatNames

export interface DocumentContext extends Record<string, any> {}

/** Derived values shared by all seven sheets — the original's prelude. */
export const buildContext = async (
  data: LegacyInvoiceData,
  images: { header?: LoadedImage; footer?: LoadedImage; signature?: LoadedImage }
): Promise<DocumentContext> => {
    void images
${preludeBody}

${hoisted.join('\n\n')}

    return {
${[...contextNames, ...SHARED_CONST].map((n) => `        ${n},`).join('\n')}
    }
}
`,
  'utf8'
)

const allContextNames = [...contextNames, ...SHARED_CONST]
const bodies = { customInvoice: section1Body }
for (const section of SECTIONS.slice(1)) bodies[section.id] = slice(section.from, section.to)

for (const section of SECTIONS) {
  const body = bodies[section.id]
  const fromContext = allContextNames.filter((n) => usesName(body, n))
  const touched = CARRY.filter((n) => usesName(body, n))
  // A section declaring its own counter must not also destructure it.
  const seeded = touched.filter((n) => !declaresName(body, n))
  const imageLocals = IMAGE_LOCALS.filter((n) => usesName(body, n))

  // Sheets built earlier that this one reads — the worksheet copy, for
  // instance, seeds cells from the custom invoice's sheet.
  const earlier = SECTIONS.slice(0, SECTIONS.indexOf(section))
  const inherited = earlier
    .flatMap((s) => [s.workbook, s.sheet])
    .filter((n) => usesName(body, n) && !declaresName(body, n))

  const prologue = [
    '    const {',
    fromContext.map((n) => `        ${n}`).join(',\n'),
    '    } = ctx',
    seeded.length ? `    let { ${seeded.join(', ')} } = state` : null,
    inherited.length ? `    const { ${inherited.join(', ')} } = built` : null,
    imageLocals.length ? `    let ${imageLocals.map((n) => `${n}: any`).join(', ')}` : null
  ]
    .filter((line) => line !== null)
    .join('\n')

  writeFileSync(
    join(OUT, 'sheets', `${section.id}.ts`),
    `${banner(`// Source lines ${section.from}-${section.to}.`)}

import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { convertNamesToInitials, formatNames, round3 } from '../helpers'
import { loadImageBuffer } from '../loadImageBuffer'
import type { DocumentContext } from '../context'
import type { SheetState } from '../state'

void ExcelJS
void format
void round3
void convertNamesToInitials
void formatNames
void loadImageBuffer

export const ${section.fn} = async (
  ctx: DocumentContext,
  state: SheetState,
  built: Record<string, any> = {}
): Promise<{ workbook: any; sheet: any; state: SheetState; built: Record<string, any> }> => {
    void built
${prologue}

${body}

    // The sheet comes off the workbook rather than the local binding: in some
    // sections that binding is declared inside a conditional and is not in
    // scope here. It is the same object either way.
    return {
        workbook: ${section.workbook},
        sheet: ${section.workbook}.worksheets[0],
        state: { ...state${touched.length ? `, ${touched.join(', ')}` : ''} },
        built: {
            ...built,
            ${section.workbook}: ${section.workbook},
            ${section.sheet}: ${section.workbook}.worksheets[0]
        }
    }
}
`,
    'utf8'
  )

  console.log(
    `${section.id.padEnd(14)} ctx:${String(fromContext.length).padStart(3)}  seeded:${seeded.length}  returns:${touched.length}  images:${imageLocals.length}`
  )
}

console.log(`\nhoisted ${hoisted.length}/${SHARED_CONST.length} shared declarations`)
console.log(`context exposes ${allContextNames.length} names`)
