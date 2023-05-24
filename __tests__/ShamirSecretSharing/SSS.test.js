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
 * Filename: SSS.test.js
 * Description: Tests shamirs-secret-sharing library's split() and combine() functions 
 * Author: Dipti Mahamuni
 */

// import * as sss from "../../ShamirSecretSharing/index";
const sss = require('shamirs-secret-sharing')
import { getRandomBytes } from "expo-random";

beforeEach(() => {});

describe("Shamir Secret Sharing", () => {
  it("Splits and Combines Uint8Arrays", async () => {
    const size = 1000;
    const u8Original = new Uint8Array(size).fill(0).map((e, index) => index);

    const shares = sss.split(Buffer.from(u8Original), { shares: 8, threshold: 4, random: getRandomBytes });
    const u8AShares = shares.map((s) => new Uint8Array(s));

    const bufferShares = u8AShares.map((s) => Buffer.from(s));
    const combined = sss.combine(bufferShares);
    const u8Combined = new Uint8Array(combined);

    expect(u8Original.length).toEqual(u8Combined.length);
    expect(u8Combined.length).toEqual(size);

    const oldStr = u8Original.toString();
    const newStr = u8Combined.toString();
    expect(oldStr).toEqual(newStr);
  });
  it("Returns error when insufficient shares are combined", async () => {
    const size = 100;
    const u8Original = new Uint8Array(size).fill(0).map((e, index) => index);

    const shares = sss.split(Buffer.from(u8Original), { shares: 8, threshold: 4, random: getRandomBytes });
    const u8AShares = shares.map((s) => new Uint8Array(s));

    for (let numShares = 0; numShares < 6; numShares++) {
      const bufferShares = u8AShares.map((s) => Buffer.from(s)).filter((e, index) => index <= numShares);
      const combined = sss.combine(bufferShares);
      expect(numShares).toBeLessThan(10);
    }
  });
});
