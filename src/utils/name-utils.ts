import { faker } from "@faker-js/faker";
import json from "./json/names-1.json";
import { getRandomNumberFromRange } from "./random.ts";
import "../game/entities/types.ts";

const firstName = faker.person.firstName("male");
const lastName = faker.person.lastName();

const nameIndex = getRandomNumberFromRange(json.names.length);

console.log(json.names[nameIndex], lastName);

const fullName = `${firstName} ${lastName}`;
console.log(fullName);
