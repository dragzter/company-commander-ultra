export function getRandomIndex(keys: string[]) {
  const index = Math.floor(Math.random() * keys.length);

  return keys[index];
}

export function getRandomNumberFromRange(num: number) {
  return Math.floor(Math.random() * num);
}
