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
 * Filename: Helper.test.js
 * Description: Tests serialization/deserialization of Helper objects
 * Author: Dipti Mahamuni
 */

import { Helper, HelperStates } from "../../logic/Helper";
import { KeyTypes } from "../../logic/Key";
import { User } from "../../logic/User";
import { OperatingModes } from "../../logic/Constants";

beforeEach(() => {});

updateZuestandState = jest.fn();

describe("Helper", () => {
  it("serializes and deserializes", async () => {
    const oldObj = new Helper(new User("me", "11"), OperatingModes.Normal, "Good Helper", "22", OperatingModes.Normal, HelperStates.Paired, { PairingRequestDataGenerated: jest.fn, updateZuestandState: updateZuestandState });
    expect(updateZuestandState).toHaveBeenCalled();
    oldObj.setLockboxShare([11, 22, 33]);
    let oldStr = oldObj.toString();

    const serialized = oldObj.serialize();

    const newObj = new Helper(new User("New me", "11111"), OperatingModes.Normal, "New Good Helper", "2222", OperatingModes.Recovery, HelperStates.Pending, { PairingRequestDataGenerated: jest.fn, updateZuestandState: updateZuestandState });
    expect(updateZuestandState).toHaveBeenCalled();

    newObj.deserialize(serialized);

    let newStr = newObj.toString();
    oldStr = oldStr.replace(/lockboxShare:.*\n/, "");
    newStr = newStr.replace(/lockboxShare:.*\n/, "");

    expect(oldStr).toEqual(newStr);
  });
});
