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
 * Filename: User.ts
 * Description: Contains logic to serialize and deserialize a User object.
 * Author: Dipti Mahamuni
 */

export class User {
  name: string;
  phone: string;
  constructor(name: string, phone: string) {
    this.name = name;
    this.phone = phone;
  }

  serialize(): Uint8Array {
    const nameLen = new Uint8Array(2);
    const nameLenDataView = new DataView(nameLen.buffer, 0, 2);
    nameLenDataView.setUint16(0, this.name.length, false);
    const nameArr = new Uint8Array(Buffer.from(this.name));
    const phoneLen = new Uint8Array(2);
    const phoneLenDataView = new DataView(phoneLen.buffer, 0, 2);
    phoneLenDataView.setUint16(0, this.phone.length, false);
    const phoneArr = new Uint8Array(Buffer.from(this.phone));
    const serialized: Uint8Array = new Uint8Array([...nameLen, ...nameArr, ...phoneLen, ...phoneArr]);

    return serialized;
  }

  deserialize(serialized: Uint8Array): number {
    serialized = new Uint8Array(serialized);

    let index = 0;

    const nameLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const nameLen = nameLenDataView.getUint16(0, false);
    this.name = Buffer.from(serialized.buffer.slice(index, index + nameLen)).toString("utf-8");
    index += nameLen;

    const phoneLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const phoneLen = phoneLenDataView.getUint16(0, false);
    this.phone = Buffer.from(serialized.buffer.slice(index, index + phoneLen)).toString("utf-8");
    index += phoneLen;

    return index;
  }

  toString(short = false): string {
    return `User name: ${this.name} - phone: ${this.phone}\n`;
  }
}
