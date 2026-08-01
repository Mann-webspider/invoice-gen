/**
 * The counters the seven sheets hand to each other.
 *
 * In the original these were `let` bindings in one 8,000-line function, so
 * every sheet could see whatever the previous one left behind. Most sheets
 * reset them before reading — `row = 27`, `srNo = 1` — but two genuinely carry
 * over: the worksheet copy reads the running `srNo` from the custom invoice to
 * divide freight and insurance across the line items, and the annexure reads
 * `allProductsType`.
 *
 * Passing them explicitly keeps that behaviour identical while making it
 * visible, rather than leaving it as an accident of shared scope.
 */
export interface SheetState {
  srNo: number
  row: number
  hsnCode: number
  allProductsType: string
  skipRow: number
  addSkipRow: number
  /** Column-width cap; looks constant but each sheet resets it. */
  MAX_WIDTH: number
}

export const initialSheetState = (): SheetState => ({
  srNo: 1,
  row: 1,
  hsnCode: 0,
  allProductsType: '',
  skipRow: 0,
  addSkipRow: 0,
  MAX_WIDTH: 0
})
