/**
 * La Marzocco Coffee Machine class
 */

import { LaMarzoccoThing, checkModelSupported } from "./thing";
import { LaMarzoccoCloudClient } from "../clients";
import {
  DoseMode,
  MachineMode,
  ModelCode,
  PreExtractionMode,
  SmartStandByType,
  SteamTargetLevel,
  WidgetType,
} from "../const";
import { CloudOnlyFunctionality } from "../exceptions";
import {
  CoffeeAndFlushCounter,
  CoffeeAndFlushTrend,
  CoffeeBoiler,
  LastCoffeeList,
  MachineStatus,
  PrebrewSettingTimes,
  SteamBoilerLevel,
  SteamBoilerTemperature,
  ThingSchedulingSettings,
  WakeUpScheduleSettings,
} from "../models";

/**
 * La Marzocco Coffee Machine
 */
export class LaMarzoccoMachine extends LaMarzoccoThing {
  public schedule: ThingSchedulingSettings;

  constructor(
    serialNumber: string,
    cloudClient: LaMarzoccoCloudClient | null = null
  ) {
    super(serialNumber, cloudClient);
    this.schedule = {
      serialNumber,
    };
  }

  /**
   * Get the schedule for this machine
   */
  async getSchedule(): Promise<void> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    this.schedule = await this.cloudClient.getThingSchedule(this.serialNumber);
  }

  /**
   * Set machine power on/off
   */
  async setPower(enabled: boolean): Promise<boolean> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }

    const result = await this.cloudClient.setPower(this.serialNumber, enabled);

    // Update dashboard if command succeeded
    if (result && WidgetType.CM_MACHINE_STATUS in this.dashboard.config) {
      const machineStatus = this.dashboard.config[
        WidgetType.CM_MACHINE_STATUS
      ] as MachineStatus;
      machineStatus.mode = enabled
        ? MachineMode.BREWING_MODE
        : MachineMode.STANDBY;
    }

    return result;
  }

  /**
   * Set steam on/off
   */
  async setSteam(enabled: boolean): Promise<boolean> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }

    const result = await this.cloudClient.setSteam(this.serialNumber, enabled);

    // Update dashboard if command succeeded
    if (result) {
      if (WidgetType.CM_STEAM_BOILER_LEVEL in this.dashboard.config) {
        const steamLevel = this.dashboard.config[
          WidgetType.CM_STEAM_BOILER_LEVEL
        ] as SteamBoilerLevel;
        steamLevel.enabled = enabled;
      }
      if (WidgetType.CM_STEAM_BOILER_TEMPERATURE in this.dashboard.config) {
        const steamTemp = this.dashboard.config[
          WidgetType.CM_STEAM_BOILER_TEMPERATURE
        ] as SteamBoilerTemperature;
        steamTemp.enabled = enabled;
      }
    }

    return result;
  }

  /**
   * Set steam target level (Micra, Mini R only)
   */
  async setSteamLevel(level: SteamTargetLevel): Promise<boolean> {
    checkModelSupported(this.dashboard, [
      ModelCode.LINEA_MICRA,
      ModelCode.LINEA_MINI_R,
    ]);

    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }

    const result = await this.cloudClient.setSteamTargetLevel(
      this.serialNumber,
      level
    );

    // Update dashboard if command succeeded
    if (result && WidgetType.CM_STEAM_BOILER_LEVEL in this.dashboard.config) {
      const steamLevel = this.dashboard.config[
        WidgetType.CM_STEAM_BOILER_LEVEL
      ] as SteamBoilerLevel;
      steamLevel.targetLevel = level;
    }

    return result;
  }

  /**
   * Set coffee target temperature
   */
  async setCoffeeTargetTemperature(temperature: number): Promise<boolean> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }

    const result = await this.cloudClient.setCoffeeTargetTemperature(
      this.serialNumber,
      temperature
    );

    // Update dashboard if command succeeded
    if (result && WidgetType.CM_COFFEE_BOILER in this.dashboard.config) {
      const coffeeBoiler = this.dashboard.config[
        WidgetType.CM_COFFEE_BOILER
      ] as CoffeeBoiler;
      coffeeBoiler.targetTemperature = temperature;
    }

    return result;
  }

  /**
   * Set steam target temperature (GS3 models only)
   */
  async setSteamTargetTemperature(temperature: number): Promise<boolean> {
    checkModelSupported(this.dashboard, [
      ModelCode.GS3,
      ModelCode.GS3_AV,
      ModelCode.GS3_MP,
    ]);

    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }

    const result = await this.cloudClient.setSteamTargetTemperature(
      this.serialNumber,
      temperature
    );

    // Update dashboard if command succeeded
    if (
      result &&
      WidgetType.CM_STEAM_BOILER_TEMPERATURE in this.dashboard.config
    ) {
      const steamTemp = this.dashboard.config[
        WidgetType.CM_STEAM_BOILER_TEMPERATURE
      ] as SteamBoilerTemperature;
      steamTemp.targetTemperature = temperature;
    }

    return result;
  }

  /**
   * Start backflush cleaning (cloud only)
   */
  async startBackflush(): Promise<boolean> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    return await this.cloudClient.startBackflushCleaning(this.serialNumber);
  }

  /**
   * Set pre-extraction mode (cloud only)
   */
  async setPreExtractionMode(mode: PreExtractionMode): Promise<boolean> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    return await this.cloudClient.changePreExtractionMode(
      this.serialNumber,
      mode
    );
  }

  /**
   * Set pre-extraction times (cloud only)
   */
  async setPreExtractionTimes(
    secondsOn: number,
    secondsOff: number
  ): Promise<boolean> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    const times: PrebrewSettingTimes = {
      times: {
        secondsIn: secondsOn,
        secondsOut: secondsOff,
      },
    };
    return await this.cloudClient.changePreExtractionTimes(
      this.serialNumber,
      times
    );
  }

  /**
   * Set smart standby mode
   */
  async setSmartStandby(
    enabled: boolean,
    minutes: number,
    mode: SmartStandByType
  ): Promise<boolean> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }

    return await this.cloudClient.setSmartStandby(
      this.serialNumber,
      enabled,
      minutes,
      mode
    );
  }

  /**
   * Delete a wakeup schedule (cloud only)
   */
  async deleteWakeupSchedule(scheduleId: string): Promise<boolean> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    return await this.cloudClient.deleteWakeupSchedule(
      this.serialNumber,
      scheduleId
    );
  }

  /**
   * Set a wakeup schedule (cloud only)
   */
  async setWakeupSchedule(schedule: WakeUpScheduleSettings): Promise<boolean> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    return await this.cloudClient.setWakeupSchedule(this.serialNumber, schedule);
  }

  /**
   * Set brew by weight dose mode (Linea Mini models only, cloud only)
   */
  async setBrewByWeightDoseMode(mode: DoseMode): Promise<boolean> {
    checkModelSupported(this.dashboard, [
      ModelCode.LINEA_MINI,
      ModelCode.LINEA_MINI_R,
    ]);

    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    return await this.cloudClient.changeBrewByWeightDoseMode(
      this.serialNumber,
      mode
    );
  }

  /**
   * Set brew by weight dose (Linea Mini models only, cloud only)
   */
  async setBrewByWeightDose(dose: DoseMode, value: number): Promise<boolean> {
    checkModelSupported(this.dashboard, [
      ModelCode.LINEA_MINI,
      ModelCode.LINEA_MINI_R,
    ]);

    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }

    // Get current doses from dashboard
    if (!(WidgetType.CM_BREW_BY_WEIGHT_DOSES in this.dashboard.config)) {
      return false;
    }

    const brewByWeight = this.dashboard.config[
      WidgetType.CM_BREW_BY_WEIGHT_DOSES
    ] as any;

    // Set the dose values, keeping the other one unchanged
    let dose1: number;
    let dose2: number;

    if (dose === DoseMode.DOSE_1) {
      dose1 = value;
      dose2 = brewByWeight.doses.dose2.dose;
    } else if (dose === DoseMode.DOSE_2) {
      dose1 = brewByWeight.doses.dose1.dose;
      dose2 = value;
    } else {
      return false;
    }

    return await this.cloudClient.setBrewByWeightDose(
      this.serialNumber,
      dose1,
      dose2
    );
  }

  /**
   * Get coffee and flush trend (cloud only)
   */
  async getCoffeeAndFlushTrend(
    days: number,
    timezone: string
  ): Promise<CoffeeAndFlushTrend> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    const trend = await this.cloudClient.getThingCoffeeAndFlushTrend(
      this.serialNumber,
      days,
      timezone
    );
    this.statistics.widgets[WidgetType.COFFEE_AND_FLUSH_TREND] = trend;
    return trend;
  }

  /**
   * Get last coffee (cloud only)
   */
  async getLastCoffee(days: number): Promise<LastCoffeeList> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    const lastCoffee = await this.cloudClient.getThingLastCoffee(
      this.serialNumber,
      days
    );
    this.statistics.widgets[WidgetType.LAST_COFFEE] = lastCoffee;
    return lastCoffee;
  }

  /**
   * Get coffee and flush counter (cloud only)
   */
  async getCoffeeAndFlushCounter(): Promise<CoffeeAndFlushCounter> {
    if (!this.cloudClient) {
      throw new CloudOnlyFunctionality();
    }
    const counter = await this.cloudClient.getThingCoffeeAndFlushCounter(
      this.serialNumber
    );
    this.statistics.widgets[WidgetType.COFFEE_AND_FLUSH_COUNTER] = counter;
    return counter;
  }

  /**
   * Convert to dictionary representation
   */
  toDict(): Record<string, any> {
    return {
      ...super.toDict(),
      schedule: this.schedule,
    };
  }
}

