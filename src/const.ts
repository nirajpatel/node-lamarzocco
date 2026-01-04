/**
 * Constants for La Marzocco Cloud and Bluetooth
 */

export const BASE_URL = "lion.lamarzocco.io";
export const CUSTOMER_APP_URL = `https://${BASE_URL}/api/customer-app`;

/**
 * Machine modes
 */
export enum MachineMode {
  BREWING_MODE = "BrewingMode",
  ECO_MODE = "EcoMode",
  STANDBY = "StandBy",
}

/**
 * Machine states
 */
export enum MachineState {
  STANDBY = "StandBy",
  POWERED_ON = "PoweredOn",
  BREWING = "Brewing",
  OFF = "Off",
}

/**
 * Pre-extraction modes
 */
export enum PreExtractionMode {
  PREINFUSION = "PreInfusion",
  PREBREWING = "PreBrewing",
  DISABLED = "Disabled",
}

/**
 * Widget types
 */
export enum WidgetType {
  CM_MACHINE_STATUS = "CMMachineStatus",
  CM_COFFEE_BOILER = "CMCoffeeBoiler",
  CM_STEAM_BOILER_LEVEL = "CMSteamBoilerLevel",
  CM_PRE_EXTRACTION = "CMPreExtraction",
  CM_PRE_BREWING = "CMPreBrewing",
  CM_BACK_FLUSH = "CMBackFlush",
  CM_MACHINE_GROUP_STATUS = "CMMachineGroupStatus",
  CM_MACHINE_MODULE_STATUS = "CMMachineModuleStatus",
  CM_STEAM_BOILER_TEMPERATURE = "CMSteamBoilerTemperature",
  CM_GROUP_DOSES = "CMGroupDoses",
  CM_PRE_INFUSION_ENABLE = "CMPreInfusionEnable",
  CM_PRE_INFUSION = "CMPreInfusion",
  CM_BREW_BY_WEIGHT_DOSES = "CMBrewByWeightDoses",
  CM_CUP_WARMER = "CMCupWarmer",
  CM_HOT_WATER_DOSE = "CMHotWaterDose",
  CM_AUTO_FLUSH = "CMAutoFlush",
  CM_RINSE_FLUSH = "CMRinseFlush",
  CM_STEAM_FLUSH = "CMSteamFlush",
  CM_NO_WATER = "CMNoWater",
  CM_MODULE_AND_TAPS_TEMPERATURE = "CMModuleAndTapsTemperature",
  G_MACHINE_STATUS = "GMachineStatus",
  G_DOSES = "GDoses",
  G_SINGLE_DOSE_MODE = "GSingleDoseMode",
  G_BARISTA_LIGHT = "GBaristaLight",
  G_HOPPER_OPENED = "GHopperOpened",
  G_MIRROR_DOSES = "GMirrorDoses",
  G_MORE_DOSE = "GMoreDose",
  G_GRIND_WITH = "GGrindWith",
  G_SPEED = "GSpeed",
  THING_SCALE = "ThingScale",
  COFFEE_AND_FLUSH_TREND = "COFFEE_AND_FLUSH_TREND",
  LAST_COFFEE = "LAST_COFFEE",
  COFFEE_AND_FLUSH_COUNTER = "COFFEE_AND_FLUSH_COUNTER",
}

/**
 * Command statuses
 */
export enum CommandStatus {
  SUCCESS = "Success",
  ERROR = "Error",
  TIMEOUT = "Timeout",
  PENDING = "Pending",
  IN_PROGRESS = "InProgress",
}

/**
 * Steam target levels
 */
export enum SteamTargetLevel {
  LEVEL_1 = "Level1",
  LEVEL_2 = "Level2",
  LEVEL_3 = "Level3",
}

/**
 * STOMP message types for WebSocket
 */
export enum StompMessageType {
  CONNECT = "CONNECT",
  CONNECTED = "CONNECTED",
  SUBSCRIBE = "SUBSCRIBE",
  UNSUBSCRIBE = "UNSUBSCRIBE",
  MESSAGE = "MESSAGE",
  ERROR = "ERROR",
}

/**
 * Device types
 */
export enum DeviceType {
  MACHINE = "CoffeeMachine",
  GRINDER = "Grinder",
}

/**
 * Model codes
 */
export enum ModelCode {
  LINEA_MINI = "LINEAMINI",
  LINEA_MICRA = "LINEAMICRA",
  LINEA_MINI_R = "LINEAMINIR",
  GS3 = "GS3",
  GS3_MP = "GS3MP",
  GS3_AV = "GS3AV",
  PICO_GRINDER = "PICOGRINDER",
  SWAN_GRINDER = "SWANGRINDER",
}

/**
 * Model names
 */
export enum ModelName {
  LINEA_MINI = "Linea Mini",
  LINEA_MICRA = "Linea Micra",
  LINEA_MINI_R = "Linea Mini R",
  GS3 = "GS3",
  GS3_MP = "GS3 MP",
  GS3_AV = "GS3 AV",
  PICO_GRINDER = "Pico",
  SWAN_GRINDER = "Swan",
}

export function modelNameFromString(name: string): ModelName {
  const mapping: Record<string, ModelName> = {
    GS3MP: ModelName.GS3_MP,
    GS3AV: ModelName.GS3_AV,
    LINEAMINI2023: ModelName.LINEA_MINI_R,
    LINEAMICRA: ModelName.LINEA_MICRA,
    LINEAMINI: ModelName.LINEA_MINI,
    MICRA: ModelName.LINEA_MICRA,
    PICOGRINDER: ModelName.PICO_GRINDER,
    SWANGRINDER: ModelName.SWAN_GRINDER,
  };

  const key = name.toUpperCase().replace(/\s/g, "");
  if (!(key in mapping)) {
    throw new Error(`Invalid model name: ${name}`);
  }
  return mapping[key];
}

/**
 * Firmware types
 */
export enum FirmwareType {
  MACHINE = "Machine",
  GATEWAY = "Gateway",
}

/**
 * Dose index types
 */
export enum DoseIndexType {
  BY_GROUP = "ByGroup",
  BY_DOSE = "ByDose",
}

/**
 * Dose modes
 */
export enum DoseMode {
  CONTINUOUS = "Continuous",
  PULSES_TYPE = "PulsesType",
  DOSE_1 = "Dose1",
  DOSE_2 = "Dose2",
}

/**
 * Dose index
 */
export enum DoseIndex {
  CONTINUOUS = "Continuous",
  BY_GROUP = "ByGroup",
  DOSE_A = "DoseA",
  DOSE_B = "DoseB",
  DOSE_C = "DoseC",
  DOSE_D = "DoseD",
}

/**
 * Smart standby types
 */
export enum SmartStandByType {
  LAST_BREW = "LastBrewing",
  POWER_ON = "PowerOn",
}

/**
 * Boiler statuses
 */
export enum BoilerStatus {
  STAND_BY = "StandBy",
  HEATING = "HeatingUp",
  READY = "Ready",
  NO_WATER = "NoWater",
  OFF = "Off",
}

/**
 * Week days
 */
export enum WeekDay {
  MONDAY = "Monday",
  TUESDAY = "Tuesday",
  WEDNESDAY = "Wednesday",
  THURSDAY = "Thursday",
  FRIDAY = "Friday",
  SATURDAY = "Saturday",
  SUNDAY = "Sunday",
}

/**
 * Update statuses
 */
export enum UpdateStatus {
  TO_UPDATE = "ToUpdate",
  PENDING = "Pending",
  IN_PROGRESS = "InProgress",
  UPDATED = "Updated",
}

/**
 * Update progress info
 */
export enum UpdateProgressInfo {
  DOWNLOAD = "download",
  REBOOTING = "rebooting",
  STARTING_PROCESS = "starting process",
}

/**
 * Boiler types
 */
export enum BoilerType {
  COFFEE = "CoffeeBoiler1",
  STEAM = "SteamBoiler",
}

/**
 * Back flush statuses
 */
export enum BackFlushStatus {
  REQUESTED = "Requested",
  CLEANING = "Cleaning",
  OFF = "Off",
}

/**
 * Token and command timeouts
 */
export const TOKEN_TIME_TO_REFRESH = 10 * 60; // 10 minutes in seconds
export const PENDING_COMMAND_TIMEOUT = 10000; // milliseconds

/**
 * Steam level mapping
 */
export const STEAM_LEVEL_MAPPING: Record<SteamTargetLevel, number> = {
  [SteamTargetLevel.LEVEL_1]: 126,
  [SteamTargetLevel.LEVEL_2]: 128,
  [SteamTargetLevel.LEVEL_3]: 131,
};

