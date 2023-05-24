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
 * Filename: Helper.ts
 * Description: Contains logic to help with pairing and lockbox updates. Also contains logic to serialize/deserialize the Helper object.
 * Author: Dipti Mahamuni
 */

import { User } from "./User";
import { IKey, KeyTypes } from "./Key";
import { Constants, OperatingModes } from "./Constants";
import { Ed25519Keys } from "./Ed25519Keys";
import { PairingSession, PairingHandshakePacketData } from "./PairingSession";
// import { CallbackFunctions } from "./WorkQueueInterface";
import { CallbackFunctions } from "./CallbackFunctions";
import { AppLogic } from "./AppLogic";

export enum HelperStates {
  Pending,
  Paired,
}

export class Helper {
  user: User;
  state: HelperStates;
  pairingSession: PairingSession;
  operatingMode: OperatingModes;
  lockboxShare: Uint8Array;
  lockboxShareTimestamp: string;
  // Connectivity
  inSyncFlag: boolean;
  lastSyncTime: number;
  callbacks: CallbackFunctions;

  constructor(me: User, myOperatingMode: OperatingModes, name: string, phone: string, operatingMode: OperatingModes, state: HelperStates, callbacks: CallbackFunctions) {
    this.user = new User(name, phone);
    this.operatingMode = operatingMode;
    this.lockboxShare = new Uint8Array();
    this.state = state;
    this.callbacks = { ...callbacks, pairingResponseDetectedRecoveringPeer: (peerUser) => this.pairingResponseDetectedRecoveringPeer(peerUser) };
    this.pairingSession = new PairingSession(KeyTypes.Ed25519, this.callbacks);
    this.pairingSession.createPairingRequest(me, myOperatingMode);
    this.inSyncFlag = false;
    this.lastSyncTime = 0;
  }

  static dummyHelper(): Helper {
    // Return a dummy helper with random names and phone number
    const randString = new Date().toISOString();
    return new Helper(new User(randString, randString), OperatingModes.Normal, randString, randString, OperatingModes.Normal, HelperStates.Paired, { updateZuestandState: () => {} });
  }
  setUser(user: User) {
    this.user = user;
  }

  setHelperState(state: HelperStates) {
    this.state = state;
  }

  setPeerPublicKey(peerPublicKey: IKey) {
    if (peerPublicKey.type == KeyTypes.Ed25519) {
      this.pairingSession.setPeerPublicKey(peerPublicKey.type, peerPublicKey.publicKey);
    } else {
      throw "ECDSA keys not supported";
    }
  }

  setOperatingMode(mode: OperatingModes) {
    this.operatingMode = mode;
  }

  setLockboxShare(lockboxShare: any) {
    this.lockboxShare = lockboxShare;
    this.lockboxShareTimestamp = new Date().toString();
  }

  setLastSyncTime(syncTime: number) {
    this.lastSyncTime = syncTime;
    const currentTime: number = Math.ceil(new Date().getTime() / 1000);
    this.inSyncFlag = currentTime - this.lastSyncTime < Constants.KeepAliveTimeoutPeriod;
  }

  handlePairingRequest(counters: Array<number>, messages: Array<Uint8Array>) {
    return this.pairingSession.handlePairingRequest(counters, messages);
  }

  pairingResponseDetectedRecoveringPeer(peerUser: User) {
    this.callbacks.confirmPairingWithRecoveringPeer(peerUser);
  }

  createLockboxShareRetrievalResponseData(): Uint8Array {
    return this.pairingSession.encrypt(this.lockboxShare);
  }

  restoreAfterRecovery(recovered: Helper) {
    this.user = recovered.user;
    this.state = recovered.state;
    this.pairingSession.setKeys(recovered.pairingSession.keys);
    this.pairingSession.setIv(recovered.pairingSession.iv);
    this.operatingMode = recovered.operatingMode;
    this.lockboxShare = recovered.lockboxShare;
    this.lockboxShareTimestamp = recovered.lockboxShareTimestamp;
    const k = new Ed25519Keys();
    k.setKeys(new Uint8Array(), recovered.pairingSession.peerPublicKey);
    this.setPeerPublicKey(k);
  }

  serialize(): Uint8Array {
    const user = this.user.serialize();

    const nameLen = new Uint8Array(2);
    const nameLenDataView = new DataView(nameLen.buffer, 0, 2);
    nameLenDataView.setUint16(0, this.user.name.length, false);

    const helperState = new Uint8Array(1);
    switch (this.state) {
      case HelperStates.Pending:
        helperState.set([0], 0);
        break;
      case HelperStates.Paired:
        helperState.set([1], 0);
        break;
    }

    const pairingSession = this.pairingSession.serialize();

    const operatingMode = new Uint8Array(1);
    switch (this.operatingMode) {
      case OperatingModes.Normal:
        operatingMode.set([0], 0);
        break;
      case OperatingModes.Recovery:
        operatingMode.set([1], 0);
        break;
    }

    const serialized: Uint8Array = new Uint8Array([...user, ...helperState, ...pairingSession, ...operatingMode]);

    return serialized;
  }

  deserialize(serialized: Uint8Array): number {
    serialized = new Uint8Array(serialized);
    let index = this.user.deserialize(serialized);

    const helperStateTypeDataView = new DataView(serialized.buffer, index, 1);
    index += 1;
    switch (helperStateTypeDataView.getUint8(0)) {
      case 0:
        this.state = HelperStates.Pending;
        break;
      case 1:
        this.state = HelperStates.Paired;
        break;
    }

    index += this.pairingSession.deserialize(serialized.subarray(index));

    const recoveryModeDataView = new DataView(serialized.buffer, index, 1);
    index += 1;
    switch (recoveryModeDataView.getUint8(0)) {
      case 0:
        this.operatingMode = OperatingModes.Normal;
        break;
      case 1:
        this.operatingMode = OperatingModes.Recovery;
        break;
    }

    return index;
  }

  toString(short = false): string {
    let str: string = "Helper: ";
    str += this.user.toString();
    str += `State: ${this.state == HelperStates.Paired ? "Paired" : "Pending"}, operatingMode: ${this.operatingMode == OperatingModes.Normal ? "Normal" : "Recovery"}\n`;
    str += this.pairingSession.toString(short);
    str += `lockboxShare: ${this.lockboxShare.length} bytes at ${this.lockboxShareTimestamp} \n`;
    return str;
  }
}
