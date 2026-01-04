/**
 * Models for statistics
 */

import { WidgetType } from "../const";

/**
 * Thing statistics
 */
export interface ThingStatistics {
  serialNumber: string;
  widgets: Partial<Record<WidgetType, any>>;
}

/**
 * Coffee and flush counter
 */
export interface CoffeeAndFlushCounter {
  totalFlushCount: number;
  totalCoffeeCount: number;
}

/**
 * Coffee and flush trend
 */
export interface CoffeeAndFlushTrend {
  days: Array<{
    date: string;
    coffeeCount: number;
    flushCount: number;
  }>;
}

/**
 * Last coffee info
 */
export interface LastCoffee {
  timestamp: Date;
  duration: number;
  volume: number;
}

/**
 * Last coffee list
 */
export interface LastCoffeeList {
  coffees: LastCoffee[];
}

