import { faker } from "@faker-js/faker";
import json from "./json/names-1.json";
import json2 from "./json/last-names-1.json";

import {
  getRandomNumberFromRange,
  getRandomValueFromStringArray as grv,
} from "./math.ts";
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
  const lastNameIndex = getRandomNumberFromRange(json2.names.length);
  const firstName = json.names[nameIndex];
  const alternateLastName = Math.floor(Math.random() * 10);
  const lastName =
    alternateLastName > 6
      ? faker.person.lastName()
      : json2.names[lastNameIndex];

  if (Math.floor(Math.random() * 10) > 3) {
    return `${firstName} ${grv(letters)}. ${lastName}`;
  }
  return `${firstName} ${lastName}`;
}

/** Format name for display: "FirstName L." (first name + first letter of last name) */
export function formatDisplayName(name: string | null | undefined): string {
  if (name == null || typeof name !== "string") return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  const lastName = parts[parts.length - 1];
  const initial = lastName.charAt(0).toUpperCase();
  return `${parts[0]} ${initial}.`;
}

export { generateName };
