/**
 * WebSocket utility functions for STOMP protocol
 */

import { StompMessageType } from "../const";

/**
 * Encode STOMP WebSocket message
 */
export function encodeStompWsMessage(
  msgType: StompMessageType,
  headers: Record<string, string>,
  body?: string
): string {
  const fragments: string[] = [];
  fragments.push(msgType.toString());

  for (const [key, value] of Object.entries(headers)) {
    fragments.push(`${key}:${value}`);
  }

  let msg = fragments.join("\n");
  msg += "\n\n";

  if (body) {
    msg += body;
  }

  msg += "\x00";
  return msg;
}

/**
 * Decode STOMP WebSocket message
 */
export function decodeStompWsMessage(
  msg: string
): {
  msgType: StompMessageType;
  headers: Record<string, string>;
  data: string | null;
} {
  const [header, data] = msg.split("\n\n", 2);
  const headers: Record<string, string> = {};
  const metadata = header.split("\n");

  const msgType = metadata[0] as StompMessageType;

  for (let i = 1; i < metadata.length; i++) {
    const colonIdx = metadata[i].indexOf(":");
    if (colonIdx > 0) {
      const key = metadata[i].substring(0, colonIdx);
      const value = metadata[i].substring(colonIdx + 1);
      headers[key] = value;
    }
  }

  let processedData = data || null;
  if (processedData && processedData.endsWith("\x00")) {
    processedData = processedData.slice(0, -1);
  }

  return { msgType, headers, data: processedData };
}

