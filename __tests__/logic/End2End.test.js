/*
 * Copyright (C) 2023 Swirlds Labs Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Filename: End2End.test.js
 * Description: Tests normal mode operations and recovery mode operations of a user by adding test helpers and pairing with them again in recovery mode.
 * Author: Dipti Mahamuni
 */

import { AppLogic } from "../../logic/AppLogic";
import { Constants } from "../../logic/Constants";
import { User } from "../../logic/User";
import { OperatingModes } from "../../logic/Constants";
import { HelperStates, Helper } from "../../logic/Helper";
import io from "socket.io-client";
import { Ed25519Keys } from "../../logic/Ed25519Keys";
import { drecs, helpersList, createContextForOneUser } from "../../__mocks__/jestSetup";

jest.setTimeout(40000);

// const drecs = {};
const states = {};

/*
jest.mock("socket.io-client", () => {
  const mSocket = {
    emit: (type, data) => {
      console.log(`Mock socket emit type: ${type} from ${data?.fromPhone} to ${data?.toPhone}`);
      const recipeients = Object.values(testHelpers).filter((h) => h.phone == data?.toPhone);
      if (recipeients.length == 1) {
        const to = recipeients[0];
        drecs[to.name].processSockMessage(data);
      }
    },
    register: (msg) => {},
    on: (msg) => {},
    io: {
      on: (msg) => {},
    },
  };
  return jest.fn(() => mSocket);
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: (key) => {
    return new Promise((resolve) => {
      resolve(null);
    });
  },

  setItem: (key, value) => {
    return new Promise((resolve) => {
      resolve(null);
    });
  },

  clear: () => {
    return new Promise((resolve) => {
      resolve(null);
    });
  },
}));
*/

const eventConsumedCalllback = jest.fn();

const testHelpers = {
  "Grand Ma": { name: "Grand Ma", phone: "12345" },
  Alice: { name: "Alice", phone: "11" },
  Bob: { name: "Bob", phone: "22" },
  Carol: { name: "Carol", phone: "33" },
  Dave: { name: "Dave", phone: "44" },
};

beforeAll(async () => {
  // log = {};
  // ["trace", "info", "keepAlive", "pairing", "recovery", "lockbox", "error"].forEach((level) => {
  //   log[level] = jest.fn();
  // });
  // global.log = log;
  // const ENDPOINT = "localhost:3000";
  // const mockSocket = io(ENDPOINT);
});

beforeEach(async () => {
  jest.clearAllMocks();
});

// const createContextForOneUser = async (name, phone) => {
//   const callbacks = {
//     // WorkItemProcessed: eventConsumedCalllback,
//     // PairingRequestDataGenerated: jest.fn(), // (pairingRequestData) => pairingRequestDataGenerated(pairingRequestData),
//     showUserNotification: jest.fn(), //(title, description) => jest.fn(title, description),
//     updateZuestandState: jest.fn,
//     pairingHandshakeResponseMatched: jest.fn(), // () => pairingHandshakeResponseMatched(),
//     confirmPairingWithRecoveringPeer: jest.fn().mockImplementation((pairingResponsePacketForRecoveringPeer) => {
//       drecs[name].pairingResponsePacketForRecoveringPeer = pairingResponsePacketForRecoveringPeer;
//     }),
//   };
//   drecs[name] = await new AppLogic(callbacks);
//   drecs[name].callbacks = callbacks;
//   drecs[name].setUser(name, phone);
// };

// const createHelpersContext = async () => {
//   Object.values(testHelpers).forEach(async (h) => {
//     await createContextForOneUser(h.name, h.phone);
//   });
//   console.log(`created all drecs as: ${Object.keys(drecs)}`);
// };

const pair = async (a, b) => {
  console.log(`pairing ${a} with ${b}`);

  drecs[a].startPairingProcess();
  drecs[b].startPairingProcess();

  const helperForPairing = drecs[a].getHelperByPhone(Constants.unknownUserForPairing.phone);
  expect(helperForPairing).not.toBeNull();
  pairingRequestsA = helperForPairing.pairingSession.pairingRequestData;
  drecs[b].handleNewHelperPairingRequest(
    pairingRequestsA.map((p) => p[0]).filter((p, i) => i < 3),
    pairingRequestsA.filter((p, i) => i < 3)
  );
  drecs[a].handlePeriodicTasks();
  drecs[b].handlePeriodicTasks();
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, 100);
  });
};

const periodicTasks = async () => {
  for (i = 0; i < 3; i++) {
    Object.values(testHelpers).forEach(async (h) => {
      drecs[h.name].handlePeriodicTasks();
    });
  }
};

describe("<End2End />", () => {
  let notificationsCount = 1;
  it("generates multiple users", async () => {
    // Create individual app contexts for each user
    // await createHelpersContext();
    expect(drecs["Grand Ma"].helpers.length).toEqual(0);
    expect(drecs["Grand Ma"].appFlags.operatingMode).toEqual(OperatingModes.Normal);
  });

  it("adds multiple accounts", async () => {
    drecs["Grand Ma"].addAccount("Grand Ma's Account-1", "0.0.1", "Hedera Mainnet", new Ed25519Keys());
    expect(drecs["Grand Ma"].callbacks.showUserNotification).toHaveBeenCalledWith("Account (Grand Ma's Account-1) added", `Vault protection requires minimum ${Constants.minNumOfHelpers} active paired helpers`);
    expect(drecs["Grand Ma"].notifications.length).toEqual(notificationsCount++);

    drecs["Grand Ma"].addAccount("Grand Ma's Account-2", "0.0.2", "Hedera Mainnet", new Ed25519Keys());
    expect(drecs["Grand Ma"].callbacks.showUserNotification).toHaveBeenCalledWith("Account (Grand Ma's Account-2) added", `Vault protection requires minimum ${Constants.minNumOfHelpers} active paired helpers`);
    expect(drecs["Grand Ma"].notifications.length).toEqual(notificationsCount++);

    expect(drecs["Grand Ma"].vault.elements.length).toEqual(2);
  });

  it("pairs with multiple users in normal operating mode", async () => {
    const peers = Object.values(testHelpers)
      .filter((h, i) => i > 0)
      .map((h) => h.name);

    jest.clearAllMocks();

    for (i = 0; i < peers.length; i++) {
      await pair("Grand Ma", peers[i]);
      if (i < Constants.minNumOfHelpers - 1) {
        expect(drecs["Grand Ma"].callbacks.showUserNotification).toHaveBeenCalledWith(`${peers[i]} added as a helper - Vault is not protected!`, `You have less than ${Constants.minNumOfHelpers} active paired helpers`);
        expect(drecs["Grand Ma"].notifications.length).toEqual(notificationsCount++);
      } else {
        expect(drecs["Grand Ma"].callbacks.showUserNotification).toHaveBeenCalledWith(`${peers[i]} added as a helper`, "Redistributing Vault");
        expect(drecs["Grand Ma"].notifications.length).toEqual(notificationsCount++);
      }
      expect(drecs[peers[i]].callbacks.showUserNotification).toHaveBeenCalledWith("Grand Ma added as a helper - Vault is not protected!", `You have less than ${Constants.minNumOfHelpers} active paired helpers`);

      jest.clearAllMocks();
    }

    await periodicTasks();

    expect(drecs["Grand Ma"].helpers.length).toEqual(peers.length);
    expect(drecs["Grand Ma"].helpers.filter((h) => h.state != HelperStates.Paired).length).toEqual(0);
    expect(drecs["Grand Ma"].helpers.filter((h) => h.state == HelperStates.Paired).length).toEqual(peers.length);

    let lockboxShareLength = null;
    for (i = 0; i < peers.length; i++) {
      if (lockboxShareLength == null) {
        lockboxShareLength = drecs[peers[i]].helpers[0].lockboxShare.length;
      }

      expect(drecs[peers[i]].helpers.length).toEqual(1);
      expect(drecs[peers[i]].helpers[0].lockboxShare.length).toBeGreaterThan(0); // Every helper should have non zero lockbox share
      expect(drecs[peers[i]].helpers[0].lockboxShare.length).toEqual(lockboxShareLength); // Every helper should have the same length
    }
  });

  it("clears the state for Grand Ma", async () => {
    // Simulate that Grand Ma loses her phone
    drecs["Grand Ma"] = null;
    expect(drecs["Grand Ma"]).toBe(null);
  });

  it("Creates a Grand Ma context with a new recovery profile", async () => {
    await createContextForOneUser("Grand Ma", "12345");
    drecs["Grand Ma"].setOperatingMode(OperatingModes.Recovery);
    expect(drecs["Grand Ma"].helpers.length).toEqual(0);
    expect(drecs["Grand Ma"].appFlags.operatingMode).toEqual(OperatingModes.Recovery);
  });

  it("Recovers Grand Ma by pairing with a half of her helpers", async () => {
    const peers = Object.values(testHelpers)
      .filter((h, i) => i > 0)
      .map((h) => h.name);

    await pair("Grand Ma", "Alice");
    expect(drecs["Grand Ma"].callbacks.showUserNotification).toHaveBeenLastCalledWith("Alice added as a helper - Recovery in progress", "Please continue pairing with half of your original helpers");

    await pair("Grand Ma", "Carol");
    expect(drecs["Grand Ma"].callbacks.showUserNotification).toHaveBeenLastCalledWith("Recovery Successful", "Restored 2 accounts, and 4 helpers!");

    await periodicTasks();

    // console.log(`after Recovery, Grand ma vault:`, drecs["Grand Ma"].vault.toString());
    // console.log(`after Recovery, Grand ma helpers:`, drecs["Grand Ma"].helpers);

    expect(drecs["Grand Ma"].vault.elements.length).toEqual(2);

    expect(drecs["Grand Ma"].helpers.length).toEqual(peers.length);
    expect(drecs["Grand Ma"].helpers.filter((h) => h.state != HelperStates.Paired).length).toEqual(0);
    expect(drecs["Grand Ma"].helpers.filter((h) => h.state == HelperStates.Paired).length).toEqual(peers.length);
    expect(drecs["Grand Ma"].appFlags.operatingMode).toEqual(OperatingModes.Normal);
  });

  it("can add an account after recovery and send update to helpers", async () => {
    const currentLockboxLength = drecs["Alice"].helpers[0].lockboxShare.length;

    drecs["Grand Ma"].addAccount("Grand Ma's Account-AfterRecovery-1", "0.0.1111", "Hedera Mainnet", new Ed25519Keys());
    expect(drecs["Grand Ma"].callbacks.showUserNotification).toHaveBeenLastCalledWith("Account (Grand Ma's Account-AfterRecovery-1) added", "Redistributing Vault");

    expect(drecs["Alice"].helpers[0].lockboxShare.length).toBeGreaterThan(currentLockboxLength);
    expect(drecs["Bob"].helpers[0].lockboxShare.length).toBeGreaterThan(currentLockboxLength);
  });

  it("asks the user to confirm pairing with a recovering peer", async () => {
    drecs["Alice"] = null;
    expect(drecs["Alice"]).toBe(null);
    await createContextForOneUser("Alice", "11");
    drecs["Alice"].setOperatingMode(OperatingModes.Recovery);

    await pair("Grand Ma", "Alice");
    expect(drecs["Grand Ma"].callbacks.confirmPairingWithRecoveringPeer).toHaveBeenCalled();
    const peer = drecs["Grand Ma"].getHelperByPhone(Constants.unknownUserForPairing.phone);
    jest.clearAllMocks();
    await drecs["Grand Ma"].handleHelperPairingResponseBody(peer, drecs["Grand Ma"].pairingResponsePacketForRecoveringPeer);
    drecs["Grand Ma"].pairingResponsePacketForRecoveringPeer = null;
    expect(drecs["Alice"].callbacks.showUserNotification).toHaveBeenLastCalledWith("Grand Ma added as a helper - Recovery in progress", "Please continue pairing with half of your original helpers");
    expect(drecs["Grand Ma"].callbacks.showUserNotification).toHaveBeenLastCalledWith("Alice added as a helper", "Redistributing Vault");
  });
});
