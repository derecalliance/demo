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
 * Filename: Base45.ts
 * Description: Converts a string to and from base 45.
 * Author: Dipti Mahamuni
 */

export class Base45 {
  b45CharSet: Array<string>;
  b45CharIndices: Map<number, string>;

  constructor() {
    this.b45CharSet = [];
    this.b45CharIndices = new Map();

    const charsStr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
    const chars = charsStr.split("");
    let i = 0;
    for (const c of chars) {
      this.b45CharSet.push(c);
      this.b45CharIndices[c] = i;
      i++;
    }
  }

  toB45(arr: Uint8Array): Array<string> {
    const encoded: Array<string> = [];

    for (let i = 0; i < arr.length; i += 2) {
      if (i + 1 < arr.length) {
        let val = (arr[i] << 8) + arr[i + 1];
        // n = c + (d*45) + (e*45*45)
        const e = Math.floor(val / (45 * 45));
        val -= e * 45 * 45;
        const d = Math.floor(val / 45);
        const c = val - d * 45;
        encoded.push(this.b45CharSet[c]);
        encoded.push(this.b45CharSet[d]);
        encoded.push(this.b45CharSet[e]);
      } else {
        let val = arr[i];
        // n = c + (d*45)
        const d = Math.floor(val / 45);
        const c = val - d * 45;
        encoded.push(this.b45CharSet[c]);
        encoded.push(this.b45CharSet[d]);
      }
    }
    return encoded;
  }

  fromB45(arr: Array<string>): Uint8Array {
    const decoded: Array<number> = [];
    for (let i = 0; i < arr.length; i += 3) {
      if (i + 2 < arr.length) {
        const val = this.b45CharIndices[arr[i]] + this.b45CharIndices[arr[i + 1]] * 45 + this.b45CharIndices[arr[i + 2]] * 45 * 45;
        decoded.push(val >> 8);
        decoded.push(val & 0xff);
      } else {
        const val = this.b45CharIndices[arr[i]] + this.b45CharIndices[arr[i + 1]] * 45;
        decoded.push(val & 0xff);
      }
    }
    return new Uint8Array(decoded);
  }
}
