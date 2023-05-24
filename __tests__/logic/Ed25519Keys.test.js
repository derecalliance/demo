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
 * Description: Tests serialization/deserialization of Ed25519Keys objects
 * Author: Dipti Mahamuni
 */

import { Ed25519Keys } from "../../logic/Ed25519Keys";

beforeEach(() => {});

describe("Ed25519", () => {
  it("serializes and deserializes", async () => {
    const ed25519 = new Ed25519Keys();

    const oldStr = ed25519.toString();

    const serialized = ed25519.serialize();

    const newEd25519 = new Ed25519Keys();
    newEd25519.deserialize(serialized);
    const newStr = newEd25519.toString();

    expect(oldStr).toEqual(newStr);
  });
});
