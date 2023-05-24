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
 * Filename: User.test.js
 * Description: Tests serialization/deserialization of User objects
 * Author: Dipti Mahamuni
 */

import { User } from "../../logic/User";

beforeEach(() => {});

describe("User", () => {
  it("serializes and deserializes", async () => {
    const oldObj = new User("me", "11");
    const oldStr = oldObj.toString();

    const serialized = oldObj.serialize();

    const newObj = new User("garbage", "00");
    newObj.deserialize(serialized);
    const newStr = newObj.toString();

    expect(oldStr).toEqual(newStr);
  });
});
