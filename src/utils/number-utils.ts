function toNum(n: string, decimal = 2) {
  return parseFloat(parseFloat(n).toFixed(decimal));
}

function toFNum(n: number, decimal = 2) {
  return parseFloat(n.toFixed(decimal));
}

export { toFNum, toNum };
