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
