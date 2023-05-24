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
 * Filename: MessageTypes.ts
 * Description: Contains an enum for the message type and a Message class
 * Author: Dipti Mahamuni
 */

export enum MessageTypes {
  PairingRequest = "Pairing Request",
  PairingResponse = "Pairing Response",
  PairingAck = "Pairing Ack",
  KeepAliveRequest = "KeepAlive Request",
  KeepAliveResponse = "KeepAlive Response",
  LockboxShareRetrievalRequest = "Lockbox Share Retrieval Request", // Request for retriving my Lockbox Share info that was stored with a helper
  LockboxShareRetrievalResponse = "Lockbox Share Retrieval Response", // Response containing my Lockbox Share info that was stored with a helper
  LockboxShareInfoRequest = "Lockbox Share Infor Request", // Request the peer for the latest copy of their lockbox (needed in case of recovery)
  LockboxShareInfoUpdate = "Lockbox Share Info Update", // Distribution of my lockbox share - can happen solicited (as a response to LockboxShareInfoRequest), or unsolicited (for example, whenever I gain/lose a helper)
}

export class Message {
  fromPhone: string;
  toPhone: string;
  type: MessageTypes;
  nonce: Uint8Array;
  data: any;

  constructor(fromPhone: string, toPhone: string, type: MessageTypes, nonce: Uint8Array, data: any) {
    this.fromPhone = fromPhone;
    this.toPhone = toPhone;
    this.type = type;
    this.nonce = nonce;
    this.data = data;
  }

  static fromMessage(msg) {
    return new Message(msg.fromPhone, msg.toPhone, msg.type, msg.nonce, msg.data);
  }

  toString() {
    return `From: ${this.fromPhone} To: ${this.toPhone}, Type: ${MessageTypes[this.type]} Nonce: ${JSON.stringify(this.nonce)} Data: ${JSON.stringify(this.data)}`;
  }
}
