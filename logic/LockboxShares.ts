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
 * Filename: LockboxShares.ts
 * Description: Contains logic to create a lockbox object, encrypt it, and create/combine Shamir Secret Sharing shares
 * of the lockbox.
 * Author: Dipti Mahamuni
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRandomBytes } from "expo-random";
import { generateKey, secretBox, openSecretBox } from "@stablelib/nacl";
import { RandomSource } from "@stablelib/random";
import { encode, decode } from "@stablelib/base64";
// import * as sss from "../ShamirSecretSharing/index";
const sss = require('shamirs-secret-sharing')
import { OperatingModes, Constants } from "./Constants";
import { IVault } from "./Vault";
import { Sock } from "./Sock";
import { Helper, HelperStates } from "./Helper";
import { MessageTypes } from "./Message";
import { User } from "./User";
import { AccountVault } from "./AccountVault";

class PRNG implements RandomSource {
  isAvailable: boolean;
  constructor() {
    this.isAvailable = true;
  }
  randomBytes(length: number) {
    return getRandomBytes(length);
  }
}

export class LockboxShares {
  lockboxEncryptionKey: Uint8Array;
  lockboxEncryptionNonce: Uint8Array;

  retrievedLockboxSharesFromPeers: Map<string, Uint8Array>; // During recovery, this stores the shares received from peers as you pair with them in recovery mode

  constructor(operatingMode: OperatingModes) {
    // Stablelib-nacl requires system random bytes generator. And it is not available on IOS.
    // Therefore provide overriding class that implements the RandomSource interface
    const prng = new PRNG();

    function clearIfNeeded(): Promise<void> {
      if (operatingMode == OperatingModes.Recovery) {
        global.log.recovery("Cleared async store due to recovery mode");
        console.log("Cleared async store due to recovery mode");

        AsyncStorage.clear();
      }
      return new Promise(function (resolve, reject) {
        resolve();
      });
    }
    clearIfNeeded().then(() => {
      AsyncStorage.getItem("@lockbox_encryption_key").then(
        (savedLockboxEncryptionKeyStr: string | null) => {
          if (savedLockboxEncryptionKeyStr == null) {
            this.lockboxEncryptionKey = generateKey(prng);
            const newLockboxEncryptionKeyStr = encode(this.lockboxEncryptionKey);
            AsyncStorage.setItem("@lockbox_encryption_key", newLockboxEncryptionKeyStr);
          } else {
            this.lockboxEncryptionKey = decode(savedLockboxEncryptionKeyStr);
          }
        },
        (error) => {
          console.log(` error in AsyncStorage.getItem enc key`);
          console.log(error);
          this.lockboxEncryptionKey = new Uint8Array();
        }
      );

      AsyncStorage.getItem("@lockbox_encryption_nonce").then(
        (savedLockboxEncryptionNonceStr: string | null) => {
          if (savedLockboxEncryptionNonceStr == null) {
            this.lockboxEncryptionNonce = getRandomBytes(Constants.NaclNonceLen);
            const newLockboxEncryptionNonceStr = encode(this.lockboxEncryptionNonce);
            AsyncStorage.setItem("@lockbox_encryption_nonce", newLockboxEncryptionNonceStr);
          } else {
            this.lockboxEncryptionNonce = decode(savedLockboxEncryptionNonceStr);
          }
        },
        (error) => {
          console.log(` error in AsyncStorage.getItem nonce`);
          console.log(error);
          this.lockboxEncryptionNonce = new Uint8Array();
        }
      );
    });

    this.retrievedLockboxSharesFromPeers = new Map();
  }

  // Lockbox shares preparation and distribtion
  /**
   * @param {User}  me - The primary user of this application
   * @param {IVault} vault - Vault of the primary user
   * @param {Array<Helper>} helpers - All the helpers of the primary user
   * @param {Sock} sock - socket on which lockbox share messages are sent
   */
  public distributeLockboxShares(me: User, vault: IVault, helpers: Array<Helper>, sock: Sock) {
    const pairedHelpers = helpers.filter((h) => h.state == HelperStates.Paired).sort((a, b) => (a.user.phone < b.user.phone ? 1 : -1));

    // If there are less than the minimum number of helpers, then don't distribute the lockbox
    if (pairedHelpers.length < Constants.minNumOfHelpers) {
      return;
    }
    const shares = this.generateSharesOfEncryptionKeyAndNonce(pairedHelpers.length);
    const encryptedSerializedHelpersAndVault = this.serializeAndEncryptHelpersAndVault(vault, helpers);

    try {
      for (let index = 0; index < pairedHelpers.length; index++) {
        const helper = pairedHelpers[index];

        const lockboxShareLen = new Uint8Array(2);
        const lockboxShareLenDataView = new DataView(lockboxShareLen.buffer, 0, 2);
        lockboxShareLenDataView.setUint16(0, shares[index].length, false);

        const packet = new Uint8Array([...lockboxShareLen, ...shares[index], ...encryptedSerializedHelpersAndVault]);
        const encryptedPacket = helper.pairingSession.encrypt(packet);
        sock.send("message", { type: MessageTypes.LockboxShareInfoUpdate, fromPhone: me.phone, toPhone: helper.user.phone, data: encryptedPacket });
        global.log.lockbox(`Sent lockbox share to ${helper.user.name}`);
      }
    } catch (err) {
      global.log.lockbox(`Error in distributing lockbox shares: ` + err);
      console.log(err);
    }
  }

  generateSharesOfEncryptionKeyAndNonce(numPairedHelpers: number): Array<Uint8Array> {
    // Create Shamir Secret Sharing shares of the lockbox-encryption-key and nonce
    const serialized = this.serialize();

    const shares = sss.split(Buffer.from(serialized), { shares: numPairedHelpers, threshold: Math.ceil(numPairedHelpers / 2), random: getRandomBytes });
    const u8AShares = shares.map((s) => new Uint8Array(s));
    return u8AShares;
  }

  handleLockboxShareInfoUpdate(peer: Helper, decryptedData: Uint8Array) {
    // If we receive a lockbox share from a peer that was in recovery mode, it must mean that they have successfully completed their recovery and are in the normal mode now.
    if (peer.operatingMode != OperatingModes.Normal) {
      peer.operatingMode = OperatingModes.Normal;
    }
    peer.setLockboxShare(decryptedData);
  }

  combineSharesOfEncryptionKeyAndNonce(shares: Array<Uint8Array>) {
    const bufferShares = shares.map((s) => Buffer.from(s));
    const combined = sss.combine(bufferShares);
    const u8Combined = new Uint8Array(combined);

    this.deserialize(u8Combined);
  }

  serialize(): Uint8Array {
    const lockboxEncryptionKeyLen = new Uint8Array(2);
    const lockboxEncryptionKeyLenDataView = new DataView(lockboxEncryptionKeyLen.buffer, 0, 2);
    lockboxEncryptionKeyLenDataView.setUint16(0, this.lockboxEncryptionKey.length, false);

    const lockboxEncryptionNonceLen = new Uint8Array(2);
    const lockboxEncryptionNonceLenDataView = new DataView(lockboxEncryptionNonceLen.buffer, 0, 2);
    lockboxEncryptionNonceLenDataView.setUint16(0, this.lockboxEncryptionNonce.length, false);

    const serialized: Uint8Array = new Uint8Array([...lockboxEncryptionKeyLen, ...this.lockboxEncryptionKey, ...lockboxEncryptionNonceLen, ...this.lockboxEncryptionNonce]);

    return serialized;
  }

  deserialize(serialized: Uint8Array): number {
    serialized = new Uint8Array(serialized);

    let index = 0;
    const lockboxEncryptionKeyLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const lockboxEncryptionKeyLen = lockboxEncryptionKeyLenDataView.getUint16(0, false);

    this.lockboxEncryptionKey = new Uint8Array(serialized.buffer.slice(index, index + lockboxEncryptionKeyLen));
    index += lockboxEncryptionKeyLen;

    const lockboxEncryptionNonceLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const lockboxEncryptionNonceLen = lockboxEncryptionNonceLenDataView.getUint16(0, false);

    this.lockboxEncryptionNonce = new Uint8Array(serialized.buffer.slice(index, index + lockboxEncryptionNonceLen));
    index += lockboxEncryptionNonceLen;

    return index;
  }

  serializeAndEncryptHelpersAndVault(vault: IVault, helpers: Array<Helper>): Uint8Array {
    const numHelpersLen = new Uint8Array(2);
    const numHelpersLenDataView = new DataView(numHelpersLen.buffer, 0, 2);
    numHelpersLenDataView.setUint16(0, helpers.length, false);

    let serializedHelpers = new Uint8Array();

    helpers.forEach((h) => {
      serializedHelpers = new Uint8Array([...serializedHelpers, ...h.serialize()]);
    });

    const serializedVault = vault.serialize();

    const u8AHelpersAndVault = new Uint8Array([...numHelpersLen, ...serializedHelpers, ...serializedVault]);

    const encryptedSerializedHelpersAndVault = secretBox(this.lockboxEncryptionKey, this.lockboxEncryptionNonce, u8AHelpersAndVault);

    return encryptedSerializedHelpersAndVault;
  }

  decryptAndDeserializeHelpersAndVault(encryptedSerializedHelpersAndVault: Uint8Array): [Array<Helper>, object] | null {
    const u8AHelpersAndVault = openSecretBox(this.lockboxEncryptionKey, this.lockboxEncryptionNonce, encryptedSerializedHelpersAndVault);
    if (!u8AHelpersAndVault) {
      return null;
    }
    let index = 0;
    let deserializedHelpers: Array<Helper> = [];
    let deserializedVault: AccountVault = new AccountVault();

    const numHelpersLenDataView = new DataView(u8AHelpersAndVault.buffer, index, 2);
    index += 2;
    const numHelpersLen = numHelpersLenDataView.getUint16(0, false);

    for (let i = 0; i < numHelpersLen; i++) {
      const helper = Helper.dummyHelper(); // new Helper(new User("me", "11"), OperatingModes.Normal, "Good Helper", "22", OperatingModes.Normal, HelperStates.Paired, { updateZuestandState: () => {} });
      index += helper.deserialize(u8AHelpersAndVault.subarray(index));
      deserializedHelpers.push(helper);
    }

    index += deserializedVault.deserialize(u8AHelpersAndVault.subarray(index));

    return [deserializedHelpers, deserializedVault];
  }

  sendLockboxShareRetrievalRequest(sock: Sock, me: User, peer: Helper) {
    sock.send("message", { type: MessageTypes.LockboxShareRetrievalRequest, fromPhone: me.phone, toPhone: peer.user.phone, data: null });
  }

  separateOutShareAndEncryptedHelpersAndVault(data: Uint8Array): [lockboxShare: Uint8Array, encryptedHelpersAndVault: Uint8Array] {
    const serialized = new Uint8Array(data);

    let index = 0;
    const lockboxShareLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const lockboxShareLen = lockboxShareLenDataView.getUint16(0, false);

    const lockboxShare = new Uint8Array(serialized.buffer.slice(index, index + lockboxShareLen));
    index += lockboxShareLen;

    const encryptedHelpersAndVault = new Uint8Array(serialized.buffer.slice(index));

    return [lockboxShare, encryptedHelpersAndVault];
  }

  storeRetrievedLockboxShareAndAttemptRecovery(peer: Helper, share: Uint8Array): [Array<Helper>, object] | null {
    this.retrievedLockboxSharesFromPeers.delete(peer.user.phone);
    this.retrievedLockboxSharesFromPeers.set(peer.user.phone, share);

    // Attempt to recover the encryption key
    const retrievedShares: Array<Uint8Array> = [];
    let retrievedEncryptedHelpersAndVault: Uint8Array = new Uint8Array();
    this.retrievedLockboxSharesFromPeers.forEach((share: Uint8Array, phone: string) => {
      const [lockboxShare, encryptedHelpersAndVault] = this.separateOutShareAndEncryptedHelpersAndVault(share);
      retrievedShares.push(lockboxShare);
      retrievedEncryptedHelpersAndVault = encryptedHelpersAndVault;
    });

    const bufferShares = retrievedShares.map((s) => Buffer.from(s));
    const combined = sss.combine(bufferShares);

    // sss.combine doesnot return any error and returns some array even if there are insufficent number of helpers to recover the original secrets
    // The only way to figure out if we have the sufficient number of helpers is to try to retrieve the keys and try to decrypt the rest of the information (encrypted helpers and vault)

    try {
      this.deserialize(combined);
      if (this.lockboxEncryptionKey.length == Constants.NaclSecretKeyLen && this.lockboxEncryptionNonce.length == Constants.NaclNonceLen) {
        const response = this.decryptAndDeserializeHelpersAndVault(retrievedEncryptedHelpersAndVault);
        return response;
      }
    } catch (err) {
      // ignore ... this just means that we don't have sufficient number of helpers yet.
    }
    return null;
  }

  toString(short = false): string {
    let str: string = "";

    str += `Lockbox Encryption Key: ${this.lockboxEncryptionKey?.length > 0 ? Buffer.from(this.lockboxEncryptionKey).toString("hex") : "Null"}\n`;
    str += `Lockbox Encryption Nonce: ${this.lockboxEncryptionNonce?.length > 0 ? Buffer.from(this.lockboxEncryptionNonce).toString("hex") : "Null"}\n`;

    return str;
  }
}
