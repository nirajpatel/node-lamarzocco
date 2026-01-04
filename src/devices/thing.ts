/**
 * Base class for all La Marzocco IoT devices
 */

import { LaMarzoccoCloudClient } from "../clients";
import { ModelCode } from "../const";
import { CloudOnlyFunctionality, UnsupportedModel } from "../exceptions";
import {
  ThingDashboardConfig,
  ThingDashboardWebsocketConfig,
  ThingSettings,
  ThingStatistics,
  UpdateDetails,
  WebSocketDetails,
} from "../models";

/**
 * Base class for all La Marzocco devices
 */
export class LaMarzoccoThing {
  public serialNumber: string;
  protected cloudClient: LaMarzoccoCloudClient | null;
  protected updateCallback:
    | ((config: ThingDashboardWebsocketConfig) => void)
    | null = null;
  public dashboard: ThingDashboardConfig;
  public settings: ThingSettings;
  public statistics: ThingStatistics;

  constructor(
    serialNumber: string,
    cloudClient: LaMarzoccoCloudClient | null = null
  ) {
    this.serialNumber = serialNumber;
    this.cloudClient = cloudClient;
    this.dashboard = {} as ThingDashboardConfig;
    this.settings = {
      serialNumber,
    };
    this.statistics = {
      serialNumber,
      widgets: {},
    };
  }

  /**
   * Get the WebSocket connection details
   */
  get websocket(): WebSocketDetails {
    if (!this.cloudClient) {
      return new WebSocketDetails();
    }
    return this.cloudClient.websocket;
  }

  /**
   * Check if cloud client is available
   */
  get cloudClientAvailable(): boolean {
    return this.cloudClient !== null;
  }

  /**
   * Ensure the cloud token is valid
   */
  async ensureTokenValid(): Promise<void> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    await this.cloudClient.asyncGetAccessToken();
  }

  /**
   * Get the dashboard for this thing
   */
  async getDashboard(): Promise<void> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    this.dashboard = await this.cloudClient.getThingDashboard(this.serialNumber);
  }

  /**
   * Get the settings for this thing
   */
  async getSettings(): Promise<void> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    this.settings = await this.cloudClient.getThingSettings(this.serialNumber);
  }

  /**
   * Get the statistics for this thing
   */
  async getStatistics(): Promise<void> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    this.statistics = await this.cloudClient.getThingStatistics(
      this.serialNumber
    );
  }

  /**
   * Get the firmware details for this thing
   */
  async getFirmware(): Promise<UpdateDetails> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    return await this.cloudClient.getThingFirmware(this.serialNumber);
  }

  /**
   * Handler for receiving a websocket message
   */
  protected websocketDashboardUpdateReceived(
    config: ThingDashboardWebsocketConfig
  ): void {
    this.dashboard.widgets = config.widgets;
    this.dashboard.config = config.config;

    if (this.updateCallback) {
      this.updateCallback(config);
    }
  }

  /**
   * Connect to the cloud websocket for the dashboard
   */
  async connectDashboardWebsocket(
    updateCallback?: (config: ThingDashboardWebsocketConfig) => void,
    connectCallback?: () => void,
    disconnectCallback?: () => void,
    autoReconnect: boolean = true
  ): Promise<void> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }

    this.updateCallback = updateCallback || null;

    await this.cloudClient.websocketConnect(
      this.serialNumber,
      (config) => this.websocketDashboardUpdateReceived(config),
      connectCallback,
      disconnectCallback,
      autoReconnect
    );
  }

  /**
   * Start the firmware update process
   */
  async updateFirmware(): Promise<void> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    await this.cloudClient.updateFirmware(this.serialNumber);
  }

  /**
   * Convert to dictionary representation
   */
  toDict(): Record<string, any> {
    return {
      serialNumber: this.serialNumber,
      dashboard: this.dashboard,
      settings: this.settings,
      statistics: this.statistics,
    };
  }
}

/**
 * Helper to check if model is supported
 */
export function checkModelSupported(
  dashboard: ThingDashboardConfig,
  supportedModels: ModelCode[]
): void {
  if (!supportedModels.includes(dashboard.modelCode)) {
    const supportedNames = supportedModels.map((m) => m.toString()).join(", ");
    throw new UnsupportedModel(
      `This functionality is only supported on: ${supportedNames}.`
    );
  }
}

