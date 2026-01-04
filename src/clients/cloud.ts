/**
 * La Marzocco Cloud API Client
 */

import axios, { AxiosInstance } from "axios";
import WebSocket from "ws";
import {
  BASE_URL,
  CUSTOMER_APP_URL,
  CommandStatus,
  DoseMode,
  PreExtractionMode,
  SmartStandByType,
  SteamTargetLevel,
  StompMessageType,
  WidgetType,
  TOKEN_TIME_TO_REFRESH,
  PENDING_COMMAND_TIMEOUT,
} from "../const";
import {
  AuthFail,
  RequestNotSuccessful,
} from "../exceptions";
import {
  CommandResponse,
  Thing,
  ThingDashboardConfig,
  ThingDashboardWebsocketConfig,
  ThingSchedulingSettings,
  ThingSettings,
  ThingStatistics,
  UpdateDetails,
  WakeUpScheduleSettings,
  CoffeeAndFlushCounter,
  CoffeeAndFlushTrend,
  LastCoffeeList,
  PrebrewSettingTimes,
  WebSocketDetails,
} from "../models";
import {
  InstallationKey,
  AccessToken,
  SigninTokenRequest,
  RefreshTokenRequest,
  generateExtraRequestHeaders,
  generateRequestProof,
  getBaseString,
  getPublicKeyB64,
  createAccessToken,
} from "../util";
import { isSuccess } from "../util/generic";
import {
  encodeStompWsMessage,
  decodeStompWsMessage,
} from "../util/websocket";

/**
 * La Marzocco Cloud Client
 */
export class LaMarzoccoCloudClient {
  private client: AxiosInstance;
  private username: string;
  private password: string;
  private installationKey: InstallationKey;
  private accessToken: AccessToken | null = null;
  private accessTokenLock = false;
  private pendingCommands: Map<
    string,
    {
      resolve: (value: CommandResponse) => void;
      reject: (reason?: any) => void;
    }
  > = new Map();
  public websocket: WebSocketDetails = new WebSocketDetails();

  constructor(
    username: string,
    password: string,
    installationKey: InstallationKey,
    client?: AxiosInstance
  ) {
    this.client = client || axios.create();
    this.username = username;
    this.password = password;
    this.installationKey = installationKey;
  }

  // #region Authentication

  /**
   * Register a new client with the API
   */
  async asyncRegisterClient(): Promise<void> {
    const headers = {
      "X-App-Installation-Id": this.installationKey.installationId,
      "X-Request-Proof": generateRequestProof(
        getBaseString(this.installationKey),
        this.installationKey.secret
      ),
    };

    const body = {
      pk: getPublicKeyB64(this.installationKey),
    };

    try {
      const response = await this.client.post(
        `${CUSTOMER_APP_URL}/auth/init`,
        body,
        { headers }
      );

      if (isSuccess(response)) {
        console.log("Registration successful.");
        return;
      }

      if (response.status === 401) {
        throw new AuthFail("Invalid username or password");
      }

      throw new RequestNotSuccessful(
        `Request to auth endpoint failed with status code ${response.status}`
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new AuthFail("Invalid username or password");
        }
        throw new RequestNotSuccessful(
          `Request auth to endpoint failed with error: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async asyncGetAccessToken(): Promise<string> {
    // Simple lock mechanism
    while (this.accessTokenLock) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.accessTokenLock = true;

    try {
      const now = Math.floor(Date.now() / 1000);

      if (!this.accessToken || this.accessToken.expiresAt < now) {
        this.accessToken = await this.asyncSignIn();
      } else if (this.accessToken.expiresAt < now + TOKEN_TIME_TO_REFRESH) {
        this.accessToken = await this.asyncRefreshToken();
      }

      return this.accessToken.accessToken;
    } finally {
      this.accessTokenLock = false;
    }
  }

  /**
   * Get a new access token via sign in
   */
  private async asyncSignIn(): Promise<AccessToken> {
    console.log("Getting new access token");
    return await this.asyncGetToken(`${CUSTOMER_APP_URL}/auth/signin`, {
      username: this.username,
      password: this.password,
    });
  }

  /**
   * Refresh an access token
   */
  private async asyncRefreshToken(): Promise<AccessToken> {
    if (!this.accessToken) {
      throw new Error("No access token available");
    }
    console.log("Refreshing access token");
    return await this.asyncGetToken(`${CUSTOMER_APP_URL}/auth/refreshtoken`, {
      username: this.username,
      refreshToken: this.accessToken.refreshToken,
    });
  }

  /**
   * Wrapper for a token request
   */
  private async asyncGetToken(
    url: string,
    data: SigninTokenRequest | RefreshTokenRequest
  ): Promise<AccessToken> {
    try {
      const response = await this.client.post(url, data, {
        headers: generateExtraRequestHeaders(this.installationKey),
      });

      if (isSuccess(response)) {
        const jsonResponse = response.data;
        return createAccessToken(
          jsonResponse.accessToken,
          jsonResponse.refreshToken
        );
      }

      if (response.status === 401) {
        throw new AuthFail("Invalid username or password");
      }

      throw new RequestNotSuccessful(
        `Request to auth endpoint failed with status code ${response.status}`
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new AuthFail("Invalid username or password");
        }
        throw new RequestNotSuccessful(
          `Request auth to endpoint failed with error: ${error.message}`
        );
      }
      throw error;
    }
  }

  // #endregion

  /**
   * Wrapper for API calls
   */
  private async restApiCall(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    data?: any,
    timeout: number = 10000
  ): Promise<any> {
    const accessToken = await this.asyncGetAccessToken();
    const headers = {
      ...generateExtraRequestHeaders(this.installationKey),
      Authorization: `Bearer ${accessToken}`,
    };

    try {
      const response = await this.client.request({
        method,
        url,
        data,
        headers,
        timeout,
      });

      if (isSuccess(response)) {
        console.log(`Request to ${url} successful`);
        return response.data;
      }

      if (response.status === 401) {
        throw new AuthFail("Authentication failed.");
      }

      throw new RequestNotSuccessful(
        `Request to endpoint ${url} failed with status code ${response.status}`
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new AuthFail("Authentication failed.");
        }
        throw new RequestNotSuccessful(
          `Request to endpoint ${url} failed with error: ${error.message}`
        );
      }
      throw error;
    }
  }

  // #region Config

  /**
   * Get all things (devices) associated with the account
   */
  async listThings(): Promise<Thing[]> {
    const url = `${CUSTOMER_APP_URL}/things`;
    const result = await this.restApiCall(url, "GET");
    return result as Thing[];
  }

  /**
   * Get the dashboard of a thing
   */
  async getThingDashboard(serialNumber: string): Promise<ThingDashboardConfig> {
    const url = `${CUSTOMER_APP_URL}/things/${serialNumber}/dashboard`;
    const result = await this.restApiCall(url, "GET");
    
    // Transform widgets array into config object for easy access
    const dashboard = result as ThingDashboardConfig;
    if (dashboard.widgets && Array.isArray(dashboard.widgets)) {
      dashboard.config = {};
      for (const widget of dashboard.widgets) {
        if (widget.code && widget.output) {
          dashboard.config[widget.code] = widget.output;
        }
      }
    }
    
    return dashboard;
  }

  /**
   * Get the settings of a thing
   */
  async getThingSettings(serialNumber: string): Promise<ThingSettings> {
    const url = `${CUSTOMER_APP_URL}/things/${serialNumber}/settings`;
    const result = await this.restApiCall(url, "GET");
    return result as ThingSettings;
  }

  /**
   * Get the statistics of a thing
   */
  async getThingStatistics(serialNumber: string): Promise<ThingStatistics> {
    const url = `${CUSTOMER_APP_URL}/things/${serialNumber}/stats`;
    const result = await this.restApiCall(url, "GET");
    return result as ThingStatistics;
  }

  /**
   * Get the firmware settings of a thing
   */
  async getThingFirmware(serialNumber: string): Promise<UpdateDetails> {
    const url = `${CUSTOMER_APP_URL}/things/${serialNumber}/update-fw`;
    const result = await this.restApiCall(url, "GET");
    return result as UpdateDetails;
  }

  /**
   * Get the schedule of a thing
   */
  async getThingSchedule(serialNumber: string): Promise<ThingSchedulingSettings> {
    const url = `${CUSTOMER_APP_URL}/things/${serialNumber}/scheduling`;
    const result = await this.restApiCall(url, "GET");
    return result as ThingSchedulingSettings;
  }

  /**
   * Get extended statistics of a thing
   */
  private async getThingExtendedStatistics(
    serialNumber: string,
    widget: WidgetType,
    kwargs?: Record<string, any>
  ): Promise<any> {
    let url = `${CUSTOMER_APP_URL}/things/${serialNumber}/stats/${widget}/1`;

    if (kwargs) {
      const queryParams = Object.entries(kwargs)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
      url = `${url}?${queryParams}`;
    }

    const result = await this.restApiCall(url, "GET", undefined, 10000);
    return result.output;
  }

  /**
   * Get coffee and flush trend
   */
  async getThingCoffeeAndFlushTrend(
    serialNumber: string,
    days: number,
    timezone: string
  ): Promise<CoffeeAndFlushTrend> {
    const result = await this.getThingExtendedStatistics(
      serialNumber,
      WidgetType.COFFEE_AND_FLUSH_TREND,
      { days, timezone }
    );
    return result as CoffeeAndFlushTrend;
  }

  /**
   * Get last coffee
   */
  async getThingLastCoffee(
    serialNumber: string,
    days: number
  ): Promise<LastCoffeeList> {
    const result = await this.getThingExtendedStatistics(
      serialNumber,
      WidgetType.LAST_COFFEE,
      { days }
    );
    return result as LastCoffeeList;
  }

  /**
   * Get coffee and flush counter
   */
  async getThingCoffeeAndFlushCounter(
    serialNumber: string
  ): Promise<CoffeeAndFlushCounter> {
    const result = await this.getThingExtendedStatistics(
      serialNumber,
      WidgetType.COFFEE_AND_FLUSH_COUNTER
    );
    return result as CoffeeAndFlushCounter;
  }

  // #endregion

  // #region WebSocket

  /**
   * Connect to the machine's WebSocket for real-time updates
   */
  async websocketConnect(
    serialNumber: string,
    notificationCallback?: (config: ThingDashboardWebsocketConfig) => void,
    connectCallback?: () => void,
    disconnectCallback?: () => void,
    autoReconnect: boolean = true
  ): Promise<void> {
    while (autoReconnect) {
      try {
        const ws = new WebSocket(`wss://${BASE_URL}/ws/connect`, {
          headers: generateExtraRequestHeaders(this.installationKey),
        });

        await this.setupWebsocketConnection(ws, serialNumber);

        if (connectCallback) {
          connectCallback();
        }

        ws.on("message", (data: WebSocket.Data) => {
          this.handleWebsocketMessage(data, notificationCallback);
        });

        ws.on("close", () => {
          console.log("WebSocket closed");
          if (disconnectCallback) {
            disconnectCallback();
          }
        });

        ws.on("error", (error: Error) => {
          console.error("WebSocket error:", error);
        });

        // Wait for close
        await new Promise<void>((resolve) => {
          ws.on("close", () => resolve());
        });
      } catch (error) {
        console.error("WebSocket connection error:", error);
        if (!autoReconnect) {
          break;
        }
        // Wait before reconnecting
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Setup WebSocket connection (connect and subscribe)
   */
  private async setupWebsocketConnection(
    ws: WebSocket,
    serialNumber: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const accessToken = await this.asyncGetAccessToken();

      const connectMsg = encodeStompWsMessage(StompMessageType.CONNECT, {
        host: BASE_URL,
        "accept-version": "1.2,1.1,1.0",
        "heart-beat": "0,0",
        Authorization: `Bearer ${accessToken}`,
      });

      ws.on("open", () => {
        console.log("Connecting to websocket.");
        ws.send(connectMsg);
      });

      // Wait for CONNECTED message
      const messageHandler = (data: WebSocket.Data) => {
        const { msgType } = decodeStompWsMessage(data.toString());
        if (msgType === StompMessageType.CONNECTED) {
          console.log("Subscribing to websocket.");
          const subscriptionId = require("crypto").randomUUID();
          const subscribeMsg = encodeStompWsMessage(StompMessageType.SUBSCRIBE, {
            destination: `/ws/sn/${serialNumber}/dashboard`,
            ack: "auto",
            id: subscriptionId,
            "content-length": "0",
          });
          ws.send(subscribeMsg);

          const disconnectWebsocket = async () => {
            console.log("Disconnecting websocket");
            if (ws.readyState === WebSocket.OPEN) {
              const disconnectMsg = encodeStompWsMessage(
                StompMessageType.UNSUBSCRIBE,
                { id: subscriptionId }
              );
              ws.send(disconnectMsg);
              ws.close();
            }
          };

          this.websocket = new WebSocketDetails(ws, disconnectWebsocket);
          ws.removeListener("message", messageHandler);
          resolve();
        }
      };

      ws.on("message", messageHandler);
      ws.on("error", reject);
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleWebsocketMessage(
    data: WebSocket.Data,
    notificationCallback?: (config: ThingDashboardWebsocketConfig) => void
  ): void {
    try {
      const { msgType, data: messageData } = decodeStompWsMessage(
        data.toString()
      );

      if (msgType === StompMessageType.ERROR) {
        console.warn("Websocket error message:", messageData);
      } else if (msgType === StompMessageType.MESSAGE) {
        this.parseWebsocketMessage(messageData, notificationCallback);
      } else {
        console.warn("Non MESSAGE-type message:", data.toString());
      }
    } catch (error) {
      console.warn("Error parsing websocket message:", error);
    }
  }

  /**
   * Parse WebSocket message and handle commands/notifications
   */
  private parseWebsocketMessage(
    message: string | null,
    notificationCallback?: (config: ThingDashboardWebsocketConfig) => void
  ): void {
    if (!message) {
      return;
    }

    const config: ThingDashboardWebsocketConfig = JSON.parse(message);

    // Transform widgets array into config object for easy access
    if (config.widgets && Array.isArray(config.widgets)) {
      config.config = {};
      for (const widget of config.widgets) {
        if (widget.code && widget.output) {
          config.config[widget.code] = widget.output;
        }
      }
    }

    // Notify if there is a result for a pending command
    for (const command of config.commands || []) {
      const pending = this.pendingCommands.get(command.id);
      if (pending) {
        pending.resolve(command);
        this.pendingCommands.delete(command.id);
      }
    }

    // Notify external listeners
    if (notificationCallback) {
      notificationCallback(config);
    }
  }

  // #endregion

  // #region Commands

  /**
   * Execute a command on a machine
   */
  private async executeCommand(
    serialNumber: string,
    command: string,
    data?: any
  ): Promise<boolean> {
    const response = await this.restApiCall(
      `${CUSTOMER_APP_URL}/things/${serialNumber}/command/${command}`,
      "POST",
      data
    );

    const cr: CommandResponse = response[0];

    // If websocket is not connected, return success immediately
    if (!this.websocket.connected) {
      return true;
    }

    // Wait for command confirmation via websocket
    return new Promise<boolean>((resolve, reject) => {
      const commandTimeout = setTimeout(() => {
        this.pendingCommands.delete(cr.id);
        console.log("Timed out waiting for websocket confirmation");
        resolve(false);
      }, PENDING_COMMAND_TIMEOUT);

      this.pendingCommands.set(cr.id, {
        resolve: (result: CommandResponse) => {
          clearTimeout(commandTimeout);
          if (result.status === CommandStatus.SUCCESS) {
            resolve(true);
          } else {
            console.log(
              `Command to ${command} failed with status ${result.status}, error_details: ${result.errorCode || ""}`
            );
            resolve(false);
          }
        },
        reject,
      });
    });
  }

  /**
   * Turn machine power on or off
   */
  async setPower(serialNumber: string, enabled: boolean): Promise<boolean> {
    const mode = enabled ? "BrewingMode" : "StandBy";
    const data = { mode };
    return await this.executeCommand(serialNumber, "CoffeeMachineChangeMode", data);
  }

  /**
   * Turn steam boiler on or off
   */
  async setSteam(
    serialNumber: string,
    enabled: boolean,
    boilerIndex: number = 1
  ): Promise<boolean> {
    const data = {
      boilerIndex,
      enabled,
    };
    return await this.executeCommand(
      serialNumber,
      "CoffeeMachineSettingSteamBoilerEnabled",
      data
    );
  }

  /**
   * Set steam boiler target level
   */
  async setSteamTargetLevel(
    serialNumber: string,
    targetLevel: SteamTargetLevel,
    boilerIndex: number = 1
  ): Promise<boolean> {
    const data = {
      boilerIndex,
      targetLevel: targetLevel.toString(),
    };
    return await this.executeCommand(
      serialNumber,
      "CoffeeMachineSettingSteamBoilerTargetLevel",
      data
    );
  }

  /**
   * Set coffee boiler target temperature
   */
  async setCoffeeTargetTemperature(
    serialNumber: string,
    targetTemperature: number,
    boilerIndex: number = 1
  ): Promise<boolean> {
    const data = {
      boilerIndex,
      targetTemperature: Math.round(targetTemperature * 10) / 10,
    };
    return await this.executeCommand(
      serialNumber,
      "CoffeeMachineSettingCoffeeBoilerTargetTemperature",
      data
    );
  }

  /**
   * Set steam boiler target temperature
   */
  async setSteamTargetTemperature(
    serialNumber: string,
    targetTemperature: number,
    boilerIndex: number = 1
  ): Promise<boolean> {
    const data = {
      boilerIndex,
      targetTemperature: Math.round(targetTemperature * 10) / 10,
    };
    return await this.executeCommand(
      serialNumber,
      "CoffeeMachineSettingSteamBoilerTargetTemperature",
      data
    );
  }

  /**
   * Start backflush cleaning
   */
  async startBackflushCleaning(serialNumber: string): Promise<boolean> {
    const data = { enabled: true };
    return await this.executeCommand(
      serialNumber,
      "CoffeeMachineBackFlushStartCleaning",
      data
    );
  }

  /**
   * Change pre-extraction mode
   */
  async changePreExtractionMode(
    serialNumber: string,
    prebrewMode: PreExtractionMode
  ): Promise<boolean> {
    const data = {
      mode: prebrewMode.toString(),
    };
    return await this.executeCommand(
      serialNumber,
      "CoffeeMachinePreBrewingChangeMode",
      data
    );
  }

  /**
   * Change pre-extraction times
   */
  async changePreExtractionTimes(
    serialNumber: string,
    times: PrebrewSettingTimes
  ): Promise<boolean> {
    return await this.executeCommand(
      serialNumber,
      "CoffeeMachinePreBrewingSettingTimes",
      times
    );
  }

  /**
   * Set smart standby
   */
  async setSmartStandby(
    serialNumber: string,
    enabled: boolean,
    minutes: number,
    after: SmartStandByType
  ): Promise<boolean> {
    const data = { enabled, minutes, after: after.toString() };
    return await this.executeCommand(
      serialNumber,
      "CoffeeMachineSettingSmartStandBy",
      data
    );
  }

  /**
   * Delete a wakeup schedule
   */
  async deleteWakeupSchedule(
    serialNumber: string,
    scheduleId: string
  ): Promise<boolean> {
    const data = { id: scheduleId };
    return await this.executeCommand(
      serialNumber,
      "CoffeeMachineDeleteWakeUpSchedule",
      data
    );
  }

  /**
   * Set a wakeup schedule
   */
  async setWakeupSchedule(
    serialNumber: string,
    schedule: WakeUpScheduleSettings
  ): Promise<boolean> {
    return await this.executeCommand(
      serialNumber,
      "CoffeeMachineSetWakeUpSchedule",
      schedule
    );
  }

  /**
   * Change brew by weight dose mode
   */
  async changeBrewByWeightDoseMode(
    serialNumber: string,
    mode: DoseMode
  ): Promise<boolean> {
    const data = { mode: mode.toString() };
    return await this.executeCommand(
      serialNumber,
      "CoffeeMachineBrewByWeightChangeMode",
      data
    );
  }

  /**
   * Set brew by weight doses
   */
  async setBrewByWeightDose(
    serialNumber: string,
    dose1: number,
    dose2: number
  ): Promise<boolean> {
    const data = {
      doses: {
        Dose1: Math.round(dose1 * 10) / 10,
        Dose2: Math.round(dose2 * 10) / 10,
      },
    };
    return await this.executeCommand(
      serialNumber,
      "CoffeeMachineBrewByWeightSettingDoses",
      data
    );
  }

  /**
   * Install firmware update
   */
  async updateFirmware(serialNumber: string): Promise<UpdateDetails> {
    const url = `${CUSTOMER_APP_URL}/things/${serialNumber}/update-fw`;
    const response = await this.restApiCall(url, "POST");
    return response as UpdateDetails;
  }

  // #endregion
}

