# node-lamarzocco

A Node.js/TypeScript library to interface with La Marzocco's Home machines. This is a port of the [pylamarzocco](https://github.com/zweckj/pylamarzocco) Python library.

![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

This library provides two main components:

- **`LaMarzoccoCloudClient`** - Interacts with La Marzocco's cloud API to send commands and retrieve machine information. Supports WebSocket connections for real-time updates.
- **`LaMarzoccoMachine`** - High-level interface for interacting with La Marzocco machines via the cloud client.

## Installation

```bash
npm install node-lamarzocco
```

## Prerequisites

- Node.js >= 18.0.0

## Quick Start

### Generating Installation Key

First, generate an installation key for your client:

```typescript
import { generateInstallationKey, installationKeyToJSON } from "node-lamarzocco";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";

// Generate new key material
const installationKey = generateInstallationKey(uuidv4().toLowerCase());

// Save it for future use
fs.writeFileSync(
  "installation_key.json",
  installationKeyToJSON(installationKey)
);
```

### Initializing the Cloud Client

```typescript
import { LaMarzoccoCloudClient, installationKeyFromJSON } from "node-lamarzocco";
import * as fs from "fs";

// Load existing key material
const installationKeyJson = fs.readFileSync("installation_key.json", "utf-8");
const installationKey = installationKeyFromJSON(installationKeyJson);

const cloudClient = new LaMarzoccoCloudClient(
  "your_username",
  "your_password",
  installationKey
);

// Register the client (only needed once for new installation keys)
await cloudClient.asyncRegisterClient();
```

### Using the Machine Interface

```typescript
import {
  LaMarzoccoCloudClient,
  LaMarzoccoMachine,
  installationKeyFromJSON,
} from "node-lamarzocco";
import * as fs from "fs";

const SERIAL = "your_serial_number";
const USERNAME = "your_username";
const PASSWORD = "your_password";

async function main() {
  // Load installation key
  const installationKeyJson = fs.readFileSync("installation_key.json", "utf-8");
  const installationKey = installationKeyFromJSON(installationKeyJson);

  // Initialize cloud client
  const cloudClient = new LaMarzoccoCloudClient(
    USERNAME,
    PASSWORD,
    installationKey
  );

  // Initialize machine
  const machine = new LaMarzoccoMachine(SERIAL, cloudClient);

  // Get machine information
  await machine.getDashboard();
  await machine.getFirmware();
  await machine.getSettings();

  // Control the machine
  await machine.setPower(true);
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await machine.setPower(false);
}

main().catch(console.error);
```

## Machine Control Examples

### Getting Machine Information

```typescript
// Get dashboard information
await machine.getDashboard();

// Get firmware information
await machine.getFirmware();

// Get schedule settings
await machine.getSchedule();

// Get machine settings
await machine.getSettings();

// Get statistics
await machine.getStatistics();

// Get machine data as dictionary
const machineData = machine.toDict();
```

### Controlling the Machine

```typescript
import { SteamTargetLevel } from "node-lamarzocco";

// Turn machine on/off
await machine.setPower(true); // Turn on
await machine.setPower(false); // Turn off

// Control steam
await machine.setSteam(true); // Enable steam
await machine.setSteam(false); // Disable steam

// Set coffee target temperature
await machine.setCoffeeTargetTemperature(93.0);

// Set steam level (1-3) - Micra and Mini R only
await machine.setSteamLevel(SteamTargetLevel.LEVEL_2);
```

### WebSocket Support

The cloud client supports WebSocket connections for real-time updates:

```typescript
import { ThingDashboardWebsocketConfig } from "node-lamarzocco";

function callback(config: ThingDashboardWebsocketConfig) {
  console.log("Received update:", config);
}

// Connect to dashboard websocket with optional callback
await machine.connectDashboardWebsocket(callback);

// The websocket will receive real-time updates about the machine status
// To disconnect later:
await machine.websocket.disconnect();
```

## API Documentation

### LaMarzoccoCloudClient

Main methods:

- `asyncRegisterClient()` - Register a new client (one-time setup)
- `listThings()` - Get all devices associated with account
- `getThingDashboard(serialNumber)` - Get machine dashboard
- `getThingSettings(serialNumber)` - Get machine settings
- `getThingStatistics(serialNumber)` - Get machine statistics
- `setPower(serialNumber, enabled)` - Turn machine on/off
- `setSteam(serialNumber, enabled)` - Control steam boiler
- `setCoffeeTargetTemperature(serialNumber, temperature)` - Set coffee temperature
- `websocketConnect(serialNumber, callbacks...)` - Connect to WebSocket for real-time updates

### LaMarzoccoMachine

High-level interface using the cloud client:

- `getDashboard()` - Get dashboard info from cloud
- `setPower(enabled)` - Turn machine on/off via cloud
- `setSteam(enabled)` - Control steam via cloud
- `setCoffeeTargetTemperature(temperature)` - Set coffee temperature
- `setSteamLevel(level)` - Set steam level (Micra/Mini R only)
- `setSmartStandby(enabled, minutes, mode)` - Configure smart standby
- `connectDashboardWebsocket(callback)` - Connect to real-time updates

## Supported Models

- Linea Mini
- Linea Micra
- Linea Mini R
- GS3
- GS3 AV
- GS3 MP

## Error Handling

The library provides custom error classes:

- `LaMarzoccoError` - Base error class
- `AuthFail` - Authentication failure
- `RequestNotSuccessful` - HTTP request failure
- `CloudOnlyFunctionality` - Function requires cloud client
- `UnsupportedModel` - Function not supported on this model

```typescript
import { AuthFail } from "node-lamarzocco";

try {
  await cloudClient.asyncRegisterClient();
} catch (error) {
  if (error instanceof AuthFail) {
    console.error("Authentication failed - check credentials");
  }
}
```

## Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## License

MIT

## Credits

This library is a port of the excellent [pylamarzocco](https://github.com/zweckj/pylamarzocco) Python library by Josef Zweck.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

