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
 * Filename: utils.ts
 * Description: Contains helper functions to generate an xor stream and format phone numbers.
 * Author: Dipti Mahamuni
 */

export function generateXorStream(start: number, len: number): Uint8Array {
  let ret: Uint8Array = new Uint8Array();
  let b: number = start;
  for (let i = 0; i < len; i++) {
    ret = new Uint8Array([...ret, b]);
    b = (7 * b + 1) & 0xff;
  }
  return ret;
}

export function pushU16Len(arr: Array<number>, len: number) {
  arr.push((len >> 8) & 0xff);
  arr.push(len & 0xff);
}

export function popU16Len(arr: Array<number>) {
  const len = ((arr.shift() || 0) << 8) + (arr.shift() || 0);
  return len;
}

// export function normalizePhoneNumber(phone: string): string {
//   return phone.replace(/[ -\(\)]/g, "");
// }

export function formatPhoneNumber(phone: string): string {
  if (phone.length == 10) {
    return phone.replace(/(...)(...)(....)/, "($1) $2-$3");
  } else if (phone.length == 7) {
    return phone.replace(/(...)(....)/, "$2-$3");
  } else {
    return phone;
  }
}
