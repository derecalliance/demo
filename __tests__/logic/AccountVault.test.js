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
 * Filename: AccountVault.test.js
 * Description: Tests serialization/deserialization of AccountVault objects
 * Author: Dipti Mahamuni
 */

import { Account } from "../../logic/Account";
import { Ed25519Keys } from "../../logic/Ed25519Keys";
import { AccountVault } from "../../logic/AccountVault";

beforeEach(() => {});

describe("AccountVault", () => {
  it("serializes and deserializes", async () => {
    const oldObj = new AccountVault();
    const account1 = new Account("Test account 1", "0.0.1234", "Hedera Mainnet", new Ed25519Keys());
    const account2 = new Account("Test account 2", "0.0.4567", "Hedera Testnet", new Ed25519Keys());
    oldObj.addElement(account1);
    oldObj.addElement(account2);

    const oldStr = oldObj.toString();

    const serialized = oldObj.serialize();

    const newObj = new AccountVault();

    newObj.deserialize(serialized);

    const newStr = newObj.toString();

    expect(oldStr).toEqual(newStr);
  });
});
