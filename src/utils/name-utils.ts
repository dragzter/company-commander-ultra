import { faker } from "@faker-js/faker";
import json from "./json/names-1.json";
import {
  getRandomNumberFromRange,
  getRandomValueFromStringArray as grv,
} from "./random.ts";
import "../game/entities/types.ts";

function generateName() {
  const letters = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];

  const nameIndex = getRandomNumberFromRange(json.names.length);
  const firstName = json.names[nameIndex];
  const lastName = faker.person.lastName();

  const hasMiddleName = Math.floor(Math.random() * 10);

  if (hasMiddleName > 3) {
    return `${firstName} ${grv(letters)}. ${lastName}`;
  }
  return `${firstName} ${lastName}`;
}

export { generateName };
