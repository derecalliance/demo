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
 * Filename: AccountVault.ts
 * Description: Contains logic to add and remove an account from the Vault. Also contains logic to 
 * serialize and deserialize a list of accounts owned by a user.
 * Author: Dipti Mahamuni
 */

import { Account } from "./Account";
import { Ed25519Keys } from "./Ed25519Keys";
import { IVault, VaultTypes } from "./Vault";

export class AccountVault implements IVault {
  type: VaultTypes;
  elements: Array<Account>;

  constructor() {
    this.type = VaultTypes.AccountType;
    this.elements = [];
  }

  addElement(element: Account) {
    this.elements.push(element);
  }

  removeElement(id: string) {
    this.elements = this.elements.filter((e: Account) => e.id != id);
  }

  serialize(): Uint8Array {
    const type = new Uint8Array(1);
    switch (this.type) {
      case VaultTypes.AccountType:
        type.set([0], 0);
        break;
      case VaultTypes.TextType:
        type.set([1], 0);
        break;
    }

    const numElementsLen = new Uint8Array(2);
    const numElementsLenDataView = new DataView(numElementsLen.buffer, 0, 2);
    numElementsLenDataView.setUint16(0, this.elements.length, false);

    let elements = new Uint8Array();

    this.elements.forEach((e) => {
      elements = new Uint8Array([...elements, ...e.serialize()]);
    });

    const serialized: Uint8Array = new Uint8Array([...type, ...numElementsLen, ...elements]);

    return serialized;
  }

  deserialize(serialized: Uint8Array): number {
    serialized = new Uint8Array(serialized);

    let index = 0;

    const typeDataView = new DataView(serialized.buffer, index, 1);
    index += 1;
    switch (typeDataView.getUint8(0)) {
      case 0:
        this.type = VaultTypes.AccountType;
        break;
      case 1:
        this.type = VaultTypes.TextType;
        break;
    }

    const numElementsLenDataView = new DataView(serialized.buffer, index, 2);
    index += 2;
    const numElementsLen = numElementsLenDataView.getUint16(0, false);

    for (let i = 0; i < numElementsLen; i++) {
      const account = new Account("dummy", "0.0.0000", "dummy", new Ed25519Keys());
      index += account.deserialize(serialized.subarray(index));
      this.elements.push(account);
    }

    return index;
  }

  toString(short = false): string {
    let str: string = `AccountVault (${this.type})\n`;
    this.elements.forEach((e) => {
      str += e.toString(short);
    });

    return str;
  }
}
