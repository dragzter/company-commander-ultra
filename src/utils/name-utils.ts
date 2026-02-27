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

/** Format designation for display: "Rifleman", "Support", "Medic" */
export function formatDesignation(designation: string | null | undefined): string {
  const d = (designation ?? "rifleman").toString().toLowerCase();
  if (!d) return "Rifleman";
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/** Portrait URL for soldier avatars. Medics use /images/medics/, others use /images/green-portrait/. */
export function getSoldierPortraitUrl(avatar: string, designation?: string): string {
  const av = avatar || "default.png";
  const isMedic = designation?.toLowerCase() === "medic" || av.startsWith("medic_");
  const folder = isMedic ? "medics" : "green-portrait";
  // Medics must use medic_*.png; fallback for legacy/buggy data with wrong avatar
  const filename = isMedic && !av.startsWith("medic_") ? "medic_0.png" : av;
  return `/images/${folder}/${filename}`;
}

export { generateName };
