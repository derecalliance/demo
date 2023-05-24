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
 * Filename: Constants.ts
 * Description: List of constants for the application.
 * Author: Dipti Mahamuni
 */

export const Constants = {
  softwareVersion: "0.1.2",
  KeepAlivePeriod: 1000,
  KeepAliveTimeoutPeriod: 10,
  minNumOfHelpers: 3, // Minimum number of helpers before which we don't send the shares
  PairingNumCounters: 8, // How many times the QR code changes per second
  qrCodeMinLen: 200 / 2, // Min length of data encoded in the QR code to make it look dense and pretty,
  NaclNonceLen: 24,
  NaclSecretKeyLen: 32,
  EllipticEntropyLen: 25,
  unknownUserForPairing: { name: "UnknownForPairing", phone: "00000000000000000000" },
  unknownUserForRecovery: { name: "UnknownForRecovery", phone: "11111111111111111111" },
};

export enum OperatingModes {
  Normal,
  Recovery,
}

export enum PauseModes {
  Active,
  Paused,
}
