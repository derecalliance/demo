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
 * Filename: LockboxShares.test.js
 * Description: Creates a lockbox by assembling a list of Helpers and an AccountVault, then tests serialization/deserialization of the combined
 * helpers and vault (lockbox), and creates/combines shares of the encryption key and nonce for the lockbox
 * Author: Dipti Mahamuni
 */

import { Helper, HelperStates } from "../../logic/Helper";
import { VaultTypes, Vault } from "../../logic/Vault";
import { KeyTypes } from "../../logic/Key";
import { User } from "../../logic/User";
import { OperatingModes } from "../../logic/Constants";
import { LockboxShares } from "../../logic/LockboxShares";
import { AccountVault } from "../../logic/AccountVault";
import { Account } from "../../logic/Account";
import { Ed25519Keys } from "../../logic/Ed25519Keys";

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
}));

setup = async (prefix) => {
  const oldObj = await new LockboxShares();

  const helperCallbacks = {
    PairingRequestDataGenerated: jest.fn,
    updateZuestandState: jest.fn,
  };

  const h1 = new Helper(this.user, OperatingModes.Normal, `${prefix} Alice`, `${prefix} 111 1119`, OperatingModes.Normal, HelperStates.Paired, helperCallbacks);
  const h2 = new Helper(this.user, OperatingModes.Normal, `${prefix} Bob`, `${prefix} 222 2229`, OperatingModes.Recovery, HelperStates.Paired, helperCallbacks);
  const h3 = new Helper(this.user, OperatingModes.Normal, `${prefix}Carol`, `${prefix}3`, OperatingModes.Recovery, HelperStates.Paired, helperCallbacks);
  const h4 = new Helper(this.user, OperatingModes.Normal, `${prefix}Dave`, `${prefix}4`, OperatingModes.Recovery, HelperStates.Paired, helperCallbacks);

  h1.setLockboxShare(new Uint8Array([1, 2, 3]));

  const helpers = [];
  helpers.push(h1);
  helpers.push(h2);
  helpers.push(h3);
  helpers.push(h4);

  const vault = new AccountVault();
  const a1 = new Account(`Test account 1 ${prefix}`, "0.0.1", "Hedera Mainnet", new Ed25519Keys());
  const a2 = new Account(`Test account 2 ${prefix}`, "0.0.2", "Hedera Mainnet", new Ed25519Keys());

  vault.addElement(a1);
  vault.addElement(a2);

  oldObj.helpers = helpers;
  oldObj.vault = vault;

  return oldObj;
};

beforeEach(() => {});

describe("LockboxShares", () => {
  it("serializes + encrypts and decrypts + deserializes helpers and vault", async () => {
    const oldObj = await setup("old");

    const encryptedSerializedHelpersAndVault = oldObj.serializeAndEncryptHelpersAndVault(oldObj.vault, oldObj.helpers);
    const response = oldObj.decryptAndDeserializeHelpersAndVault(encryptedSerializedHelpersAndVault);
    expect(response).not.toBeNull();
    const [newHelpers, newVault] = response;

    for (const oldHelper of oldObj.helpers) {
      const newHelperArr = newHelpers.filter((nh) => nh.user.phone == oldHelper.user.phone);
      expect(newHelperArr.length).toEqual(1);
      expect(oldHelper.toString().replace(/lockboxShare:.*\n/, "")).toEqual(newHelperArr[0].toString().replace(/lockboxShare:.*\n/, ""));
    }
    expect(oldObj.vault.toString()).toEqual(newVault.toString());
  });

  it("create shares of encrytion key/nonce and recombines them", async () => {
    const oldLockbox = await setup("old");

    const oldStr = oldLockbox.toString();
    const shares = oldLockbox.generateSharesOfEncryptionKeyAndNonce(oldLockbox.helpers.length);

    const filteredShares = [shares[0], shares[3]];
    const newLockbox = await setup("new");
    newLockbox.combineSharesOfEncryptionKeyAndNonce(filteredShares);
    const newStr = newLockbox.toString();

    expect(oldStr).toEqual(newStr);
  });
});
