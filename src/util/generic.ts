/**
 * Generic utility functions
 */

import { AxiosResponse } from "axios";

/**
 * Check if HTTP response status indicates success (2xx)
 */
export function isSuccess(response: AxiosResponse): boolean {
  return response.status >= 200 && response.status < 300;
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a value is defined (not null and not undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

