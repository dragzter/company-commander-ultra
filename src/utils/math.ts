export function clamp(min: number, value: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomValueFromStringArray(keys: string[]) {
  const index = Math.floor(Math.random() * keys.length);
  return keys[index];
}

export function getRandomNumberFromRange(num: number) {
  return Math.floor(Math.random() * num);
}

export function getRandomPortraitImage(imageMap: Record<string, string>) {
  const arr = Object.keys(imageMap);
  return getRandomValueFromStringArray(arr);
}

export function toNum(n: string, decimal = 2) {
  return parseFloat(parseFloat(n).toFixed(decimal));
}

export function toFNum(n: number, decimal = 2) {
  return parseFloat(n.toFixed(decimal));
}
