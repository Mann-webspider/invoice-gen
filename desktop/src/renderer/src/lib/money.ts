import Decimal from 'decimal.js'

/**
 * Money and measurement arithmetic.
 *
 * Every value in the wizard is a string, and stays one. These helpers parse,
 * compute with decimal.js, and hand back a string, so a total is never rounded
 * through a binary float on the way to a printed invoice. The old code used
 * plain `*` and `+` on values it had read out of text inputs, and stored the
 * result in columns declared INT.
 *
 * Non-numeric entries — the live data uses '-' for products not sold by area —
 * are treated as absent rather than NaN.
 */

const parse = (value: string | number | null | undefined): Decimal | null => {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  if (text === '' || text === '-') return null
  try {
    const decimal = new Decimal(text)
    return decimal.isFinite() ? decimal : null
  } catch {
    return null
  }
}

/** Trims trailing zeros so '17.28' does not become '17.280000'. */
export const toDecimalString = (value: string | number | null | undefined): string => {
  const decimal = parse(value)
  return decimal ? decimal.toDecimalPlaces(2).toString() : ''
}

export const multiply = (
  a: string | number | null | undefined,
  b: string | number | null | undefined
): string => {
  const left = parse(a)
  const right = parse(b)
  if (!left || !right) return ''
  return left.times(right).toDecimalPlaces(2).toString()
}

export const sum = (values: (string | number | null | undefined)[]): string => {
  const total = values.reduce<Decimal>((accumulator, value) => {
    const decimal = parse(value)
    return decimal ? accumulator.plus(decimal) : accumulator
  }, new Decimal(0))
  return total.isZero() ? '' : total.toDecimalPlaces(2).toString()
}

export const isNumeric = (value: string | number | null | undefined): boolean =>
  parse(value) !== null
