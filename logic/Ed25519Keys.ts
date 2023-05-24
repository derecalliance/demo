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
 * Filename: Ed25519Keys.ts
 * Description: Creates a new ED25519 public/private keypair. Contains logic to sign a message, generate a session key, and serialize and deserialize ED25519 keys. 
 * Author: Dipti Mahamuni
 */

import { getRandomBytes } from "expo-random";

import { KeyPair, generateKeyPairFromSeed, sign, SEED_LENGTH, convertSecretKeyToX25519, convertPublicKeyToX25519 } from "@stablelib/ed25519";
import { sharedKey } from "@stablelib/x25519";
import { KeyTypes, IKey } from "./Key";

export class Ed25519Keys implements IKey {
  type: KeyTypes;
  publicKey: Uint8Array;
  privateKey: Uint8Array;

  constructor() {
    this.type = KeyTypes.Ed25519;
    const seed = getRandomBytes(SEED_LENGTH);
    const keyPair: KeyPair = generateKeyPairFromSeed(seed);

    this.privateKey = keyPair.secretKey;
    this.publicKey = keyPair.publicKey;
  }

  setKeys(privateKey: Uint8Array, publicKey: Uint8Array) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  sign(message: Uint8Array): Uint8Array {
    return sign(this.privateKey, message);
  }
  signWithKey(message: Uint8Array, key: Uint8Array): Uint8Array {
    return sign(key, message);
  }
  generateSessionKey(peerPublicKey: Uint8Array): Uint8Array {
    const x25519PrivateKey = convertSecretKeyToX25519(this.privateKey);
    const x25519PeerPublicKey = convertPublicKeyToX25519(peerPublicKey);

    const sharedSecret = sharedKey(x25519PrivateKey, x25519PeerPublicKey);
    const sessionKey = sharedSecret; // TBD: we might have to derive a sesion key from the shared secret

    return sessionKey;
  }

  serialize(): Uint8Array {
    const keyType = new Uint8Array(1);
    switch (this.type) {
      case KeyTypes.Ed25519:
        keyType.set([0], 0);
        break;
      case KeyTypes.Ecdsa:
        keyType.set([1], 0);
        break;
    }
    const publicKeyLen = new Uint8Array(2);
    const publicKeyLenDataView = new DataView(publicKeyLen.buffer, 0, 2);
    publicKeyLenDataView.setUint16(0, this.publicKey.length, false);

    const privateKeyLen = new Uint8Array(2);
    const privateKeyLenDataView = new DataView(privateKeyLen.buffer, 0, 2);
    privateKeyLenDataView.setUint16(0, this.privateKey.length, false);

    const serialized: Uint8Array = new Uint8Array([...keyType, ...publicKeyLen, ...this.publicKey, ...privateKeyLen, ...this.privateKey]);

    return serialized;
  }

  deserialize(serialized: Uint8Array): number {
    serialized = new Uint8Array(serialized);

    let index = 0;
    const keyTypeDataView = new DataView(serialized.buffer, index, 1);
    index += 1;
    switch (keyTypeDataView.getUint8(0)) {
      case 0:
        this.type = KeyTypes.Ed25519;
        break;
      case 1:
        this.type = KeyTypes.Ecdsa;
        break;
    }

    const publicKeyLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const publicKeyLen = publicKeyLenDataView.getUint16(0, false);

    this.publicKey = new Uint8Array(serialized.buffer.slice(index, index + publicKeyLen));
    index += publicKeyLen;

    const privateKeyLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;

    const privateKeyLen = privateKeyLenDataView.getUint16(0, false);
    this.privateKey = new Uint8Array(serialized.buffer.slice(index, index + privateKeyLen));
    index += privateKeyLen;
    return index;
  }

  toString(short = false): string {
    let str: string = "";

    if (short) {
      str += `Type: ${this.type} Public Key ${this.publicKey?.length} bytes, PrivateKey: ${this.privateKey?.length} bytes `;
    } else {
      str += `Type: ${this.type}\n`;
      str += `Public Key: ${Buffer.from(this.publicKey).toString("hex")}\n`;
      str += `Private Key: ${Buffer.from(this.privateKey).toString("hex")}\n`;
    }

    return str;
  }
}
