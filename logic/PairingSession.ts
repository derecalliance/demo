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
 * Filename: PairingSession.ts
 * Description: Contains logic to establish a pairing session. This includes generating a session key using Diffie-Hellman key exchange,
 * encrypting messages between peers using AES-GCM, and handling pairing messages. Also contains logic to serialize and deserialize
 * the PairingSession object.
 * Author: Dipti Mahamuni
 */

import { IKey, KeyTypes } from "./Key";
import { Ed25519Keys } from "./Ed25519Keys";
import { Constants, OperatingModes } from "./Constants";
import { User } from "./User";
import { Base45 } from "./Base45";
import { getRandomBytes } from "expo-random";
import { CallbackFunctions } from "./CallbackFunctions";
import { AES } from "@stablelib/aes";
import { GCM, NONCE_LENGTH } from "@stablelib/gcm";

export type PairingHandshakePacketData = {
  counters: Uint8Array;
  nonces: Uint8Array;
  operatingMode: OperatingModes;
  name: string;
  phone: string;
  publicKey: Uint8Array;
};

export class PairingSession {
  keys: IKey;
  iv: Uint8Array;
  peerPublicKeyType: KeyTypes;
  peerPublicKey: Uint8Array;
  sessionKeyType: KeyTypes;
  sessionKey: Uint8Array;
  gcm: GCM;

  base45: Base45;
  callbacks: CallbackFunctions;
  pairingRequestData: Array<Uint8Array>;
  pairingResponsePacketForRecoveringPeer: PairingHandshakePacketData;

  constructor(type: KeyTypes, callbacks: CallbackFunctions) {
    if (type != KeyTypes.Ed25519) {
      throw "Only ED25519 keys supported right now";
    }

    this.keys = new Ed25519Keys();
    this.iv = getRandomBytes(NONCE_LENGTH);

    this.peerPublicKey = new Uint8Array();
    this.sessionKey = new Uint8Array();
    this.callbacks = callbacks;
    this.base45 = new Base45();
  }

  setKeys(keys) {
    this.keys = keys;
  }
  setIv(iv) {
    this.iv = iv;
  }

  setPeerPublicKey(peerPublicKeyType: KeyTypes, peerPublicKey: Uint8Array) {
    this.peerPublicKeyType = peerPublicKeyType;
    this.peerPublicKey = peerPublicKey;

    if (peerPublicKeyType != KeyTypes.Ed25519) {
      throw "We only support ED25519 keys for peer public key";
    }
    // Generate session key
    this.sessionKeyType = KeyTypes.Ed25519;
    this.sessionKey = this.keys.generateSessionKey(peerPublicKey);
    const cipher = new AES(this.sessionKey);
    this.gcm = new GCM(cipher);
  }

  sign(message: Uint8Array): Uint8Array {
    if (this.sessionKey.length == 0) {
      throw "Session key is null";
    }
    return this.keys.signWithKey(message, this.sessionKey);
  }

  encrypt(message: Uint8Array): Uint8Array {
    if (this.sessionKey.length == 0) {
      console.trace();
      throw "Session key is null";
    }
    const sealed = this.gcm.seal(this.iv, message);
    return sealed;
  }

  decrypt(message: Uint8Array): Uint8Array {
    if (this.sessionKey.length == 0) {
      console.trace();
      throw "Session key is null";
    }
    const unsealed = this.gcm.open(this.iv, message);
    return unsealed ? unsealed : new Uint8Array();
  }

  pushU16Len(arr: Array<number>, len: number) {
    arr.push((len >> 8) & 0xff);
    arr.push(len & 0xff);
  }
  popU16Len(arr) {
    const len = (arr.shift() << 8) + arr.shift();
    return len;
  }

  createPairingRequest(user: User, operatingMode: OperatingModes): void {
    const cArr = getRandomBytes(1);
    const counters = Array(Constants.PairingNumCounters)
      .fill(cArr[0])
      .map((e, index) => e + index);

    const nonces = getRandomBytes(Constants.PairingNumCounters);
    this.pairingRequestData = this.generateDataForPairingRequest(user, operatingMode, this.keys.publicKey, counters, nonces);

    // set that in appLogic so that the UI can use it.
    this.callbacks.updateZuestandState();
  }

  createPairingResponse(me: User, myOperatingMode: OperatingModes, pairingData: PairingHandshakePacketData): Array<number> {
    const pairingResponsePacket = this.createPairingHandshakePacket(me, myOperatingMode, this.keys.publicKey, pairingData.counters[0], pairingData.nonces, 0);
    global.log.pairing(` createPairingResponse generated pairing response as: `, Buffer.from(pairingResponsePacket).toString("hex"));
    if (this.sessionKey.length > 0) {
      const encrypted = this.encrypt(pairingResponsePacket);
      let data = new Array();

      //  AES GCM encryption nonce, preceeded by the length
      this.pushU16Len(data, NONCE_LENGTH);
      data = data.concat(Array.from(this.iv));

      // My Public key, preceeded by the length of the public key
      this.pushU16Len(data, this.keys.publicKey.length);
      data = data.concat(Array.from(this.keys.publicKey));

      data = data.concat(Array.from(encrypted));
      return data;
    } else {
      return [];
    }
  }

  createPairingAck(): Uint8Array {
    const pairingAckPacket = new Uint8Array(4).fill(0);
    if (this.sessionKey.length > 0) {
      const encrypted = this.encrypt(pairingAckPacket);
      return encrypted;
    }
    return new Uint8Array();
  }

  handlePairingRequest(counters: Array<number>, messages: Array<Uint8Array>): PairingHandshakePacketData | undefined {
    const dataFromQrCodes = this.parseDataFromQRCodes(messages);
    if (dataFromQrCodes) {
      const peerPublicKey = dataFromQrCodes?.publicKey;
      this.setPeerPublicKey(KeyTypes.Ed25519, peerPublicKey);
    }

    return dataFromQrCodes;
  }

  handlePairingResponse(msg: Uint8Array): PairingHandshakePacketData | null {
    global.log.pairing(`in handlePairingResponse message: `, msg);
    let encryptedData;

    let serialized = new Uint8Array(msg);
    // console.log(`data`, serialized);

    let index = 0;

    const ivLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const ivLen = ivLenDataView.getUint16(0, false);
    this.iv = new Uint8Array(serialized.buffer.slice(index, index + ivLen));
    index += ivLen;

    const publicKeyLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const publicKeyLen = publicKeyLenDataView.getUint16(0, false);
    const publicKey = new Uint8Array(serialized.buffer.slice(index, index + publicKeyLen));
    index += publicKeyLen;

    this.setPeerPublicKey(KeyTypes.Ed25519, publicKey);

    const decrypted = this.decrypt(serialized.subarray(index));
    if (decrypted) {
      const pairingResponsePacket = this.parsePairingHandshakePacket(decrypted);
      if (pairingResponsePacket.operatingMode == OperatingModes.Recovery) {
        // Remember this packet and inform the front end that the peer is trying to recover, so we can check with the user if it's ok to proceed
        this.pairingResponsePacketForRecoveringPeer = pairingResponsePacket;
        this.callbacks.pairingResponseDetectedRecoveringPeer(pairingResponsePacket);
        return null;
      }
      return pairingResponsePacket;
    }
    return null;
  }

  handlePairingResponseAfterConfirmingRecoveringPeer() {
    global.log.pairing(`in handlePairingResponseAfterConfirmingRecoveringPeer `);
  }

  handlePairingAck(message: Array<number>): boolean {
    global.log.pairing(`Received PairingAck. Message: `, Buffer.from(message).toString("hex"));
    if (message.length == 4 && message.filter((e) => e != 0).length == 0) {
      global.log.pairing(`Received good ack`);
      return true;
    }
    return false;
  }

  private createPairingHandshakePacket(user: User, myOperatingMode: OperatingModes, publicKey: Uint8Array, counter: number, nonces: Uint8Array, minLength: number): Uint8Array {
    // Assemble the plaintext array as follows:
    //  a counter (for the QR code genrator, this is the counter they generate. For the response after reading the QR code, this is the counter read from the QR code)
    //  nonces (for the QR code genrator, this is one nonce. For the response after reading the QR code, this is multiple nonces)
    //  operatingMode (one byte, 0 for false, 255 for true)
    //  Name (normalized Unicode UTF-8, preceded by its length as a uint16)
    //  Phone number (an UTF-8 string without parentheses or dashes, preceded by its length as a uint16)
    //  ECDH public key (length chosen to be CNSA compliant, preceeded by its length as a uint16)

    // let result: Uint8Array = new;

    // Field 1: counter
    const counterArr = new Uint8Array(1);
    counterArr.set([counter], 0);

    // Field 2: nonces, preceeded by the number of nonces
    const noncesLen = new Uint8Array(2);
    const noncesLenDataView = new DataView(noncesLen.buffer, 0, 2).setUint16(0, nonces.length, false);

    // Field 3: operatingMode
    const recoveryModeArr = new Uint8Array(1);
    switch (myOperatingMode) {
      case OperatingModes.Normal:
        recoveryModeArr.set([0], 0);
        break;
      case OperatingModes.Recovery:
        recoveryModeArr.set([1], 0);
        break;
    }

    // Field 4: Name, preceeded by the length of the name
    const nameLen = new Uint8Array(2);
    const nameLenDataView = new DataView(nameLen.buffer, 0, 2);
    nameLenDataView.setUint16(0, user.name.length, false);
    const nameArr = new Uint8Array(Buffer.from(user.name));

    // Field 5: Phone number, preceeded by the length of the phone number (without any spaces, +, - or parentheses)
    const phoneLen = new Uint8Array(2);
    const phoneLenDataView = new DataView(phoneLen.buffer, 0, 2);
    phoneLenDataView.setUint16(0, user.phone.length, false);
    const phoneArr = new Uint8Array(Buffer.from(user.phone.replace(/[+\- \(\)]/g, "")));

    // Field 6: Public key, preceeded by the length of the public key
    const publicKeyLen = new Uint8Array(2);
    const publicKeyLenDataView = new DataView(publicKeyLen.buffer, 0, 2);
    publicKeyLenDataView.setUint16(0, publicKey.length, false);

    let serialized: Uint8Array = new Uint8Array([...counterArr, ...noncesLen, ...nonces, ...recoveryModeArr, ...nameLen, ...nameArr, ...phoneLen, ...phoneArr, ...publicKeyLen, ...publicKey]);

    if (serialized.length < minLength) {
      const paddingLen = minLength - serialized.length;
      serialized = new Uint8Array([...serialized, ...new Uint8Array(paddingLen)]);
    }

    return serialized;
  }

  generateDataForPairingRequest(user: User, myOperatingMode: OperatingModes, publicKey: Uint8Array, counters: Array<number>, nonces: Uint8Array): Array<Uint8Array> {
    if (!publicKey || !user) {
      return [];
    }

    const ret: Array<Uint8Array> = [];
    for (let index = 0; index < Constants.PairingNumCounters; index++) {
      const counter = counters[index];
      const plaintextArr = this.createPairingHandshakePacket(user, myOperatingMode, publicKey, counter, new Uint8Array(1).fill(nonces[index]), Constants.qrCodeMinLen);
      ret.push(plaintextArr);
    }

    return ret;
  }

  parsePairingHandshakePacket(arr: Uint8Array): PairingHandshakePacketData {
    global.log.pairing(`parsing PairingHandshake Packet : ${Buffer.from(arr).toString("hex")}`);
    const serialized = new Uint8Array(arr);
    let index = 0;

    const counterDataView = new DataView(serialized.buffer, index, 1);
    index += 1;
    const counters = new Uint8Array([counterDataView.getUint8(0)]);

    const noncesLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const noncesLen = noncesLenDataView.getUint16(0, false);
    const nonces = new Uint8Array(serialized.buffer.slice(index, index + noncesLen));
    index += noncesLen;

    let operatingMode = OperatingModes.Normal;
    const recoveryModeDataView = new DataView(serialized.buffer, index, 1);
    index += 1;
    switch (recoveryModeDataView.getUint8(0)) {
      case 0:
        operatingMode = OperatingModes.Normal;
        break;
      case 1:
        operatingMode = OperatingModes.Recovery;
        break;
    }

    const nameLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const nameLen = nameLenDataView.getUint16(0, false);
    const name = Buffer.from(serialized.buffer.slice(index, index + nameLen)).toString("utf-8");
    index += nameLen;

    const phoneLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const phoneLen = phoneLenDataView.getUint16(0, false);
    const phone = Buffer.from(serialized.buffer.slice(index, index + phoneLen)).toString("utf-8");
    index += phoneLen;

    const publicKeyLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const publicKeyLen = publicKeyLenDataView.getUint16(0, false);
    const publicKey = new Uint8Array(serialized.buffer.slice(index, index + publicKeyLen));
    index += publicKeyLen;

    const retObj: PairingHandshakePacketData = { counters: counters, nonces: nonces, operatingMode: operatingMode, name: name, phone: phone, publicKey: publicKey };

    return retObj;
  }

  parseDataFromQRCodes(inputArr: Array<Uint8Array>): PairingHandshakePacketData | undefined {
    let retObj: PairingHandshakePacketData | undefined = undefined;
    for (const u8input of inputArr) {
      const input = u8input;

      const counter = input[0];
      global.log.pairing(`${new Date()} - ${new Date().getTime()}  received counter: ${counter}  len: ${input.length}`);
      const plaintextArr = input;
      try {
        const onePkt: PairingHandshakePacketData = this.parsePairingHandshakePacket(plaintextArr);
        if (retObj == undefined) {
          retObj = onePkt;
        } else {
          retObj.counters = new Uint8Array([...retObj.counters, ...onePkt.counters]);
        }
      } catch (err) {
        return undefined;
      }
    }

    return retObj;
  }

  serialize(): Uint8Array {
    const key = this.keys.serialize();
    const ivLen = new Uint8Array(2);
    const ivLenDataView = new DataView(ivLen.buffer, 0, 2);
    ivLenDataView.setUint16(0, this.iv.length, false);

    const peerPublicKeyType = new Uint8Array(1);
    switch (this.peerPublicKeyType) {
      case KeyTypes.Ed25519:
        peerPublicKeyType.set([0], 0);
        break;
      case KeyTypes.Ecdsa:
        peerPublicKeyType.set([1], 0);
        break;
    }
    const peerPublicKeyLen = new Uint8Array(2);

    const peerPublicKeyLenDataView = new DataView(peerPublicKeyLen.buffer, 0, 2);
    peerPublicKeyLenDataView.setUint16(0, this.peerPublicKey ? this.peerPublicKey.length : 0, false);

    const sessionKeyType = new Uint8Array(1);
    switch (this.sessionKeyType) {
      case KeyTypes.Ed25519:
        sessionKeyType.set([0], 0);
        break;
      case KeyTypes.Ecdsa:
        sessionKeyType.set([1], 0);
        break;
    }
    const sessionKeyLen = new Uint8Array(2);

    const sessionKeyLenDataView = new DataView(sessionKeyLen.buffer, 0, 2);
    sessionKeyLenDataView.setUint16(0, this.sessionKey ? this.sessionKey.length : 0, false);

    const part1: Uint8Array = new Uint8Array([...key, ...ivLen, ...this.iv]);
    let part2: Uint8Array;
    if (this.peerPublicKey.length > 0) {
      part2 = new Uint8Array([...peerPublicKeyType, ...peerPublicKeyLen, ...this.peerPublicKey]);
    } else {
      part2 = new Uint8Array([...peerPublicKeyType, ...peerPublicKeyLen]);
    }
    let part3;
    if (this.sessionKey.length > 0) {
      part3 = new Uint8Array([...sessionKeyType, ...sessionKeyLen, ...this.sessionKey]);
    } else {
      part3 = new Uint8Array([...sessionKeyType, ...sessionKeyLen]);
    }

    const serialized: Uint8Array = new Uint8Array([...part1, ...part2, ...part3]);

    return serialized;
  }

  deserialize(serialized: Uint8Array): number {
    serialized = new Uint8Array(serialized);

    let index = this.keys.deserialize(serialized);

    const ivLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const ivLen = ivLenDataView.getUint16(0, false);
    this.iv = new Uint8Array(serialized.buffer.slice(index, index + ivLen));
    index += ivLen;

    const peerPublicKeyTypeDataView = new DataView(serialized.buffer, index, 1);
    index += 1;
    switch (peerPublicKeyTypeDataView.getUint8(0)) {
      case 0:
        this.peerPublicKeyType = KeyTypes.Ed25519;
        break;
      case 1:
        this.peerPublicKeyType = KeyTypes.Ecdsa;
        break;
    }

    const peerPublicKeyLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const peerPublicKeyLen = peerPublicKeyLenDataView.getUint16(0, false);
    this.peerPublicKey = new Uint8Array(serialized.buffer.slice(index, index + peerPublicKeyLen));
    index += peerPublicKeyLen;

    const sessionKeyTypeDataView = new DataView(serialized.buffer, index, 1);
    index += 1;
    switch (sessionKeyTypeDataView.getUint8(0)) {
      case 0:
        this.sessionKeyType = KeyTypes.Ed25519;
        break;
      case 1:
        this.sessionKeyType = KeyTypes.Ecdsa;
        break;
    }

    const sessionKeyLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const sessionKeyLen = sessionKeyLenDataView.getUint16(0, false);
    this.sessionKey = new Uint8Array(serialized.buffer.slice(index, index + sessionKeyLen));
    index += sessionKeyLen;

    return index;
  }

  toString(short = false): string {
    let str: string = "Pairing Session: ";
    str += `keys: ${this.keys.toString(short)}\n`;
    if (short) {
      str += `iv ${this.iv?.length > 0 ? this.iv?.length : 0} bytes, PublicKey: ${this.peerPublicKey.length > 0 ? this.peerPublicKey?.length : 0} bytes, SessionKey: ${this.sessionKey?.length > 0 ? this.sessionKey?.length : 0} bytes\n`;
    } else {
      str += `iv ${this.iv ? Buffer.from(this.iv).toString("hex") : "-"}\n`;
      str += `peerPubKey ${this.peerPublicKey.length > 0 ? Buffer.from(this.peerPublicKey).toString("hex") : "-"}\n`;
      str += `sessionKey  ${this.sessionKey.length > 0 ? Buffer.from(this.sessionKey).toString("hex") : "-"}\n`;
    }
    return str;
  }
}
