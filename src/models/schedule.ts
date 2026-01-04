/**
 * Models for scheduling
 */

import { WeekDay } from "../const";

/**
 * Wake up schedule settings
 */
export interface WakeUpScheduleSettings {
  id?: string;
  enabled: boolean;
  days: WeekDay[];
  hour: number;
  minute: number;
}

/**
 * Thing scheduling settings
 */
export interface ThingSchedulingSettings {
  serialNumber: string;
  wakeUpSchedules?: WakeUpScheduleSettings[];
}

