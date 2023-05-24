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
 * Filename: Base45.test.ts
 * Description: Tests encoding and decoding of base-45 strings
 * Author: Dipti Mahamuni
 */

import { Base45 } from "../../logic/Base45";

let vectors: Array<Array<number>>;

beforeEach(() => {
  vectors = [
    [0, 1, 2, 3, 4, 5],
    [1, 0, 3, 2, 4, 5],
    [252, 253, 254, 255],
    [1, 252, 253, 254, 255],
    [126, 127, 128, 129, 130],
  ];
  vectors.push(
    Array(256)
      .fill(0)
      .map((x, index) => index)
  );
  vectors.push(
    Array(256)
      .fill(0)
      .map((x, index) => 255 - index)
  );
});

describe("Base45", () => {
  it("encodes and decodes", async () => {
    const base45 = new Base45();

    for (const v of vectors) {
      let success = true;
      const encoded = base45.toB45(v);
      const decoded = base45.fromB45(encoded);
      expect(v.length).toEqual(decoded.length);
      expect(v.join("-")).toEqual(decoded.join("-"));
    }
  });
});
