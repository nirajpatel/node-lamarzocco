/**
 * Models for firmware updates
 */

import { FirmwareType, UpdateStatus } from "../const";

/**
 * Firmware settings
 */
export interface FirmwareSettings {
  firmwareType: FirmwareType;
  version: string;
  available: boolean;
}

/**
 * Update details
 */
export interface UpdateDetails {
  status: UpdateStatus;
  firmware: FirmwareSettings[];
  progress?: number;
}

