/**
 * One-time script to generate an installation key
 * Run this once: npx ts-node generate_key.ts
 * Then copy the output into example.ts as INSTALLATION_KEY_JSON
 */

import { v4 as uuidv4 } from "uuid";
import { generateInstallationKey, installationKeyToJSON } from "./src/util/authentication";

console.log("Generating new installation key...\n");

const key = generateInstallationKey(uuidv4().toLowerCase());
const keyJson = installationKeyToJSON(key);

console.log("Copy this into your code as INSTALLATION_KEY_JSON:");
console.log("=".repeat(70));
console.log(keyJson);
console.log("=".repeat(70));
console.log("\nDone! Keep this key safe and reuse it in your web app.");

