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
 * Filename: Account.test.js
 * Description: Tests serialization/deserialization of Account objects, and tests adding and removing accounts
 * Author: Dipti Mahamuni
 */

import { AppLogic } from "../../logic/AppLogic";
import { Account } from "../../logic/Account";
import { Ed25519Keys } from "../../logic/Ed25519Keys";
import { Constants } from "../../logic/Constants";

var appLogic;

const callbacks = {
  showUserNotification: jest.fn(),
  updateZuestandState: jest.fn(),
  pairingHandshakeResponseMatched: jest.fn(),
  confirmPairingWithRecoveringPeer: jest.fn(),
};

beforeAll(async () => {
  appLogic = await new AppLogic(callbacks);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Account", () => {
  it("serializes and deserializes", async () => {
    const oldObj = new Account("Test account 1", "0.0.1234", "Hedera Mainnet", new Ed25519Keys());
    const oldStr = oldObj.toString();

    const serialized = oldObj.serialize();

    const newObj = new Account("New Test account", "0.0.xxxx", "Hedera Mainnet", new Ed25519Keys());

    newObj.deserialize(serialized);

    const newStr = newObj.toString();
    expect(oldStr).toEqual(newStr);
  });
  it("adds accounts", async () => {
    appLogic.addAccount("Test account addition", "0.0.1234", "Hedera Mainnet", new Ed25519Keys());
    expect(callbacks.updateZuestandState).toHaveBeenCalled();
    expect(callbacks.showUserNotification).toHaveBeenCalledWith("Account (Test account addition) added", `Vault protection requires minimum ${Constants.minNumOfHelpers} active paired helpers`);
    expect(appLogic.notifications.length).toEqual(1);
  });
  it("removes accounts", async () => {
    const arr = appLogic.vault.elements.filter((account) => account.name == "Test account addition");
    expect(arr.length).toBe(1);
    appLogic.removeAccount(arr[0].id);
    expect(callbacks.updateZuestandState).toHaveBeenCalled();
    expect(callbacks.showUserNotification).toHaveBeenCalledWith("Account deleted", `Vault protection requires minimum ${Constants.minNumOfHelpers} active paired helpers`);
    expect(appLogic.notifications.length).toEqual(2);
  });
});
