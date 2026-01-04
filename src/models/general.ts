/**
 * General models for La Marzocco API
 */

import {
  CommandStatus,
  DeviceType,
  ModelCode,
  ModelName,
  WidgetType,
  BoilerStatus,
  MachineMode,
  MachineState,
  SteamTargetLevel,
  PreExtractionMode,
  BackFlushStatus,
} from "../const";
import WebSocket from "ws";

/**
 * Command response model
 */
export interface CommandResponse {
  id: string;
  status: CommandStatus;
  errorCode?: string | null;
}

/**
 * Thing (device) information
 */
export interface Thing {
  serialNumber: string;
  type: DeviceType;
  name: string;
  location?: string | null;
  modelCode: ModelCode;
  modelName: ModelName;
  connected: boolean;
  connectionDate: Date;
  offlineMode: boolean;
  requireFirmwareUpdate: boolean;
  availableFirmwareUpdate: boolean;
  coffeeStation?: any | null;
  imageUrl: string;
  bleAuthToken?: string | null;
}

/**
 * Base widget output
 */
export interface BaseWidgetOutput {
  widgetType?: WidgetType;
}

/**
 * Base widget
 */
export interface BaseWidget {
  code: WidgetType;
  index: number;
}

/**
 * Widget with output
 */
export interface Widget extends BaseWidget {
  output: BaseWidgetOutput;
}

/**
 * Last coffee/flush info
 */
export interface LastBrewInfo {
  time: number;
  extractionSeconds: number;
  doseMode: string;
  doseIndex: string;
  doseValue: number;
  doseValueNumerator?: number | null;
}

/**
 * Machine status widget
 */
export interface MachineStatus extends BaseWidgetOutput {
  widgetType: WidgetType.CM_MACHINE_STATUS;
  status: MachineState;
  availableModes: MachineMode[];
  mode: MachineMode;
  nextStatus?: NextStatus | null;
  brewingStartTime?: number | null;
  lastCoffee?: LastBrewInfo | null;
  lastFlush?: LastBrewInfo | null;
}

/**
 * Next status configuration
 */
export interface NextStatus {
  status: MachineState;
  startTime: Date;
}

/**
 * Coffee boiler widget
 */
export interface CoffeeBoiler extends BaseWidgetOutput {
  widgetType: WidgetType.CM_COFFEE_BOILER;
  status: BoilerStatus;
  enabled: boolean;
  enabledSupported: boolean;
  targetTemperature: number;
  targetTemperatureMin: number;
  targetTemperatureMax: number;
  targetTemperatureStep: number;
  readyStartTime?: Date | null;
}

/**
 * Steam boiler level widget (Micra, Mini R)
 */
export interface SteamBoilerLevel extends BaseWidgetOutput {
  widgetType: WidgetType.CM_STEAM_BOILER_LEVEL;
  status: BoilerStatus;
  enabled: boolean;
  enabledSupported: boolean;
  targetLevel: SteamTargetLevel;
  targetLevelSupported: boolean;
}

/**
 * Steam boiler temperature widget (GS3, original Mini)
 */
export interface SteamBoilerTemperature extends BaseWidgetOutput {
  widgetType: WidgetType.CM_STEAM_BOILER_TEMPERATURE;
  status: BoilerStatus;
  enabled: boolean;
  enabledSupported: boolean;
  targetTemperature: number;
  targetTemperatureMin: number;
  targetTemperatureMax: number;
  targetTemperatureStep: number;
  targetTemperatureSupported: boolean;
}

/**
 * No water widget
 */
export interface NoWater extends BaseWidgetOutput {
  widgetType: WidgetType.CM_NO_WATER;
  allarm: boolean; // Note: typo preserved from API
}

/**
 * Pre-extraction widget
 */
export interface PreExtraction extends BaseWidgetOutput {
  widgetType: WidgetType.CM_PRE_EXTRACTION;
  mode: PreExtractionMode;
}

/**
 * Prebrew setting times
 */
export interface PrebrewSettingTimes {
  times: SecondsInOut;
}

/**
 * Seconds in/out for prebrew
 */
export interface SecondsInOut {
  secondsIn: number;
  secondsOut: number;
}

/**
 * Backflush widget
 */
export interface BackFlush extends BaseWidgetOutput {
  widgetType: WidgetType.CM_BACK_FLUSH;
  status: BackFlushStatus;
}

/**
 * Dashboard configuration
 */
export interface ThingDashboardConfig extends Thing {
  widgets: Widget[];
  config: Partial<Record<WidgetType, BaseWidgetOutput>>;
}

/**
 * WebSocket dashboard configuration
 */
export interface ThingDashboardWebsocketConfig {
  widgets: Widget[];
  config: Partial<Record<WidgetType, BaseWidgetOutput>>;
  connected: boolean;
  removedWidgets: BaseWidget[];
  connectionDate: number;
  uuid: string;
  commands: CommandResponse[];
}

/**
 * WebSocket connection details
 */
export class WebSocketDetails {
  private ws: WebSocket | null = null;
  private disconnectCallback: (() => Promise<void>) | null = null;

  constructor(ws?: WebSocket, disconnectCallback?: () => Promise<void>) {
    this.ws = ws || null;
    this.disconnectCallback = disconnectCallback || null;
  }

  get connected(): boolean {
    if (!this.ws) {
      return false;
    }
    return this.ws.readyState === WebSocket.OPEN;
  }

  async disconnect(): Promise<void> {
    if (this.disconnectCallback) {
      await this.disconnectCallback();
    }
  }
}

