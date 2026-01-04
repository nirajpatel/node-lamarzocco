/**
 * Example usage of the La Marzocco Node.js Client
 */

import {
  LaMarzoccoCloudClient,
  LaMarzoccoMachine,
  WidgetType,
  MachineStatus,
  MachineState,
  installationKeyFromJSON,
} from "./src";
import * as fs from "fs";

// Configuration - Replace with your values
const USERNAME = ""; // Your La Marzocco account email
const PASSWORD = ""; // Your La Marzocco account password
const INSTALLATION_KEY_FILE = "installation_key.json";

/**
 * Load installation key from JSON file
 */
function getInstallationKey() {
  const keyJson = fs.readFileSync(INSTALLATION_KEY_FILE, "utf-8");
  return installationKeyFromJSON(keyJson);
}

/**
 * Machine status return type
 */
// interface MachineStatusInfo {
//   serialNumber: string;
//   name: string;
//   modelName: string;
//   connected: boolean;
//   state: MachineState;
//   mode: MachineMode;
// }

// /**
//  * Get Machine Status
//  * Returns a status object with all machine information
//  */
// async function getMachineStatus(): Promise<MachineStatusInfo> {
//   // Get installation key
//   const installationKey = getInstallationKey();

//   // Initialize cloud client
//   const cloudClient = new LaMarzoccoCloudClient(
//     USERNAME,
//     PASSWORD,
//     installationKey
//   );

//   // Get machine
//   const things = await cloudClient.listThings();
//   const thing = things[0];
//   const serialNumber = thing?.serialNumber;

//   // Initialize machine and get dashboard
//   const machine = new LaMarzoccoMachine(serialNumber, cloudClient);
//   await machine.getDashboard();

//   // Get machine status from dashboard
//   const machineStatus = machine.dashboard.config[
//     WidgetType.CM_MACHINE_STATUS
//   ] as MachineStatus | undefined;

//   if (!machineStatus) {
//     throw new Error("Machine status widget not found in dashboard");
//   }

//   // Build status object
//   const statusInfo: MachineStatusInfo = {
//     serialNumber: serialNumber,
//     name: thing?.name || serialNumber,
//     modelName: machine.dashboard.modelName,
//     connected: machine.dashboard.connected,
//     state: machineStatus.status,
//     mode: machineStatus.mode
//   };

//   return statusInfo;
// }

/**
 * Stream machine status updates via WebSocket
 */
async function streamMachineStatus() {
  console.log("\n=== Streaming Machine Status ===\n");

  // Get installation key
  const installationKey = getInstallationKey();

  // Initialize cloud client
  const cloudClient = new LaMarzoccoCloudClient(
    USERNAME,
    PASSWORD,
    installationKey
  );

  // Get machine
  const things = await cloudClient.listThings();
  const thing = things[0];
  const serialNumber = thing?.serialNumber;
  const machine = new LaMarzoccoMachine(serialNumber, cloudClient);

  // Get initial status
  await machine.getDashboard();
  const initialStatus = machine.dashboard.config[
    WidgetType.CM_MACHINE_STATUS
  ] as MachineStatus;

  console.log(`Machine: ${thing?.name} (${serialNumber})`);
  console.log(`Model: ${machine.dashboard.modelName}`);
  console.log(`\nInitial Status:`);
  console.log(`  State: ${initialStatus?.status}`);
  console.log(`  Mode: ${initialStatus?.mode}`);
  console.log(`\nWaiting for updates... (Press Ctrl+C to stop)\n`);

  let lastState = initialStatus?.status;
  let lastMode = initialStatus?.mode;
  let brewingStartTime: Date | null = null;
  let brewingInterval: NodeJS.Timeout | null = null;

  // Connect to websocket with callbacks
  await machine.connectDashboardWebsocket(
    async (config) => {
      const timestamp = new Date().toLocaleTimeString();
      
      // Get machine status from the update
      const machineStatus = config.config[
        WidgetType.CM_MACHINE_STATUS
      ] as MachineStatus | undefined;

      if (machineStatus) {
        const currentState = machineStatus.status;
        const currentMode = machineStatus.mode;

        // Check if state or mode changed
        const stateChanged = currentState !== lastState;
        const modeChanged = currentMode !== lastMode;

        // Handle state changes
        if (stateChanged) {
          console.log(`[${timestamp}] 🔄 Status Update:`);
          console.log(`  State: ${lastState} → ${currentState}`);
          
          // Brewing started
          if (currentState === MachineState.BREWING && machineStatus.brewingStartTime) {
            brewingStartTime = new Date(machineStatus.brewingStartTime);
            console.log(`\n☕ Brewing Started!`);
            console.log(`  Start Time: ${brewingStartTime.toLocaleTimeString()}`);
            
            // Clear any existing interval
            if (brewingInterval) {
              clearInterval(brewingInterval);
            }
            
            // Start timer to show brewing progress
            brewingInterval = setInterval(() => {
              if (brewingStartTime) {
                const elapsed = Math.floor((Date.now() - brewingStartTime.getTime()) / 1000);
                process.stdout.write(`\r  ⏱️  Brewing Time: ${elapsed}s`);
              }
            }, 1000);
          }
          
          // Brewing finished
          if (lastState === MachineState.BREWING && currentState === MachineState.POWERED_ON) {
            // Stop the timer
            if (brewingInterval) {
              clearInterval(brewingInterval);
              brewingInterval = null;
              process.stdout.write('\n');
            }
            
            console.log(`\n✅ Brew Complete!`);
            
            // Try to fetch brew details with retries
            try {
              console.log(`  Fetching brew details...`);
              
              let brewData: any = null;
              let attempts = 0;
              const maxAttempts = 3;
              
              // Try up to 3 times with 2 second delays
              while (!brewData && attempts < maxAttempts) {
                if (attempts > 0) {
                  console.log(`  Retrying... (attempt ${attempts + 1}/${maxAttempts})`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                await machine.getDashboard();
                
                const updatedStatus = machine.dashboard.config[
                  WidgetType.CM_MACHINE_STATUS
                ] as MachineStatus | undefined;
                
                brewData = updatedStatus?.lastCoffee || updatedStatus?.lastFlush || null;
                attempts++;
              }
              
              if (brewData) {
                const brewDuration = brewData.extractionSeconds || 0;
                const brewWeight = brewData.doseValue || 0;
                
                console.log(`  Duration: ${brewDuration.toFixed(1)}s`);
                if (brewWeight > 0) {
                  console.log(`  Weight: ${brewWeight.toFixed(1)}g`);
                } else {
                  console.log(`  Weight: Not recorded`);
                }
              } else {
                console.log(`  ℹ️  Brew data not available after ${maxAttempts} attempts`);
                console.log(`     Note: Your machine may not be tracking brew data`);
                console.log(`           (requires connected scale for weight tracking)`);
              }
            } catch (error) {
              console.log(`  ⚠️  Could not fetch brew details: ${error}`);
            }
            
            brewingStartTime = null;
          }
          
          lastState = currentState;
          console.log();
        }
        
        // Handle mode changes separately
        if (modeChanged && !stateChanged) {
          console.log(`[${timestamp}] 🔄 Mode Update:`);
          console.log(`  Mode: ${lastMode} → ${currentMode}`);
          lastMode = currentMode;
          console.log();
        }
        
        // Update mode even if we already logged a state change
        if (modeChanged) {
          lastMode = currentMode;
        }
      }
    },
    () => {
      console.log("✓ WebSocket Connected!\n");
    },
    () => {
      console.log("\n✗ WebSocket Disconnected");
    },
    true // Auto-reconnect to keep streaming
  );
}

/**
 * Main function - runs all examples
 */
async function main() {
  console.log("La Marzocco Node.js Client - Examples\n");
  console.log("=" .repeat(50));

  try {
    // Stream machine status updates via WebSocket
    await streamMachineStatus();
    
    // This will run indefinitely until you press Ctrl+C
  } catch (error) {
    console.error("\nError streaming updates:", error);
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log("\nExiting...");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
