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
 * Filename: Account.ts
 * Description: Contains logic for serializing and deserializing a user's account information (name, accountId, network, keys)
 * Author: Dipti Mahamuni
 */

import { Ed25519Keys } from "./Ed25519Keys";
import { IKey, KeyTypes } from "./Key";
import { EcdsaKeys } from "./EcdsaKeys";

export class Account {
  id: string;
  name: string;
  accountId: string;
  key: IKey;
  network: string;

  constructor(name: string, accountId: string, network: string, key: IKey) {
    if (key.privateKey.length == 0 || key.publicKey.length == 0) {
      throw "Invalid key length";
    }
    this.id = new Date().toISOString();
    this.name = name;
    this.accountId = accountId;
    this.network = network;
    this.key = key;
  }

  serialize(): Uint8Array {
    const idLen = new Uint8Array(2);
    const idLenDataView = new DataView(idLen.buffer, 0, 2);
    idLenDataView.setUint16(0, this.id.length, false);
    const idArr = new Uint8Array(Buffer.from(this.id));

    const nameLen = new Uint8Array(2);
    const nameLenDataView = new DataView(nameLen.buffer, 0, 2);
    nameLenDataView.setUint16(0, this.name.length, false);
    const nameArr = new Uint8Array(Buffer.from(this.name));

    const accountIdLen = new Uint8Array(2);
    const accountIdLenDataView = new DataView(accountIdLen.buffer, 0, 2);
    accountIdLenDataView.setUint16(0, this.accountId.length, false);
    const accountIdArr = new Uint8Array(Buffer.from(this.accountId));

    const key = this.key.serialize();

    const networkLen = new Uint8Array(2);
    const networkLenDataView = new DataView(networkLen.buffer, 0, 2);
    networkLenDataView.setUint16(0, this.network.length, false);
    const networkArr = new Uint8Array(Buffer.from(this.network));

    const serialized: Uint8Array = new Uint8Array([...idLen, ...idArr, ...nameLen, ...nameArr, ...accountIdLen, ...accountIdArr, ...key, ...networkLen, ...networkArr]);

    return serialized;
  }

  deserialize(serialized: Uint8Array): number {
    serialized = new Uint8Array(serialized);

    let index = 0;

    const idLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const idLen = idLenDataView.getUint16(0, false);
    this.id = Buffer.from(serialized.buffer.slice(index, index + idLen)).toString("utf-8");
    index += idLen;

    const nameLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const nameLen = nameLenDataView.getUint16(0, false);
    this.name = Buffer.from(serialized.buffer.slice(index, index + nameLen)).toString("utf-8");
    index += nameLen;

    const accountIdLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const accountIdLen = accountIdLenDataView.getUint16(0, false);
    this.accountId = Buffer.from(serialized.buffer.slice(index, index + accountIdLen)).toString("utf-8");
    index += accountIdLen;

    index += this.key.deserialize(serialized.subarray(index));

    const networkLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const networkLen = networkLenDataView.getUint16(0, false);
    this.network = Buffer.from(serialized.buffer.slice(index, index + networkLen)).toString("utf-8");
    index += networkLen;

    return index;
  }

  toString(short = false): string {
    let str: string = `Account (${this.id}) Name ${this.name} AccountId: ${this.accountId} Network ${this.network}\n`;
    if (!short) {
      str += `Key: ${this.key.toString(short)}\n`;
    }
    return str;
  }
}
