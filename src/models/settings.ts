/**
 * Models for machine settings
 */

import { DoseMode } from "../const";

/**
 * Dose info
 */
export interface DoseInfo {
  dose: number;
  target: number;
}

/**
 * Brew by weight doses
 */
export interface BrewByWeightDoses {
  mode: DoseMode;
  doses: {
    dose1: DoseInfo;
    dose2: DoseInfo;
  };
}

/**
 * Thing settings (machine configuration)
 */
export interface ThingSettings {
  serialNumber: string;
  [key: string]: any; // Allow additional configuration properties
}

