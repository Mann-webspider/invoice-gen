# Document generation

`excel/` is a mechanical split of `ui/src/lib/excelGenerator.ts` — 8,251 lines of
ExcelJS cell arithmetic that produce the seven export workbooks. It is the
product, so it was moved rather than rewritten.

## Layout

| File | What it is |
|---|---|
| `excel/context.ts` | The original's prelude: ~99 derived values every sheet reads |
| `excel/sheets/*.ts` | One file per workbook, body copied verbatim |
| `excel/state.ts` | The counters the sheets hand to each other |
| `excel/helpers.ts` | `round3`, `convertNamesToInitials`, `formatNames` |
| `excel/images.ts` | Letterheads read from disk, sized from the file header |
| `excel/loadImageBuffer.ts` | Drop-in for the browser fetch the sheets call |
| `excel/index.ts` | Runs the seven sheets in order |
| `mapper.ts` | `WizardData` → the legacy shape the sheets read |
| `docx.ts` | Port of `wordGenerator.ts` |

## Rules

The generated files carry `@ts-nocheck` and `eslint-disable`. The original was
written with TypeScript strictness off, so type-checking it would mean editing
the very lines that must not change. **Do not edit `context.ts` or `sheets/*.ts`
by hand.** Change `ui/src/lib/excelGenerator.ts` and re-run:

```
npm run docs:split
```

## Why the sheets are not independent

They share mutable state. The worksheet copy divides freight and insurance by
the running line count the custom invoice left in `srNo`; the annexure reads
`allProductsType`; every sheet resets `MAX_WIDTH`. The worksheet copy also reads
cells straight off the custom invoice's sheet object. `SheetState` and the
`built` bag make that traffic explicit without changing what any sheet computes.

## Proving it still matches

`npm run docs:compare` runs the untouched original and this port on the same
input and diffs every cell — value, number format, border, alignment, font,
fill, merges and column widths — across all seven workbooks.

Last run: **8,868 cells compared, zero differences.**

The fixture it uses is built from the client's real database and is not
committed; regenerate it before running the comparison.
