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
 * Filename: Store.ts
 * Description: Contains interface DerecState that outlines the Zustand state, which contains the user, appFlags, vault, 
 * helpers, notifications, and QR code data, with their respective update functions. The function useDerecstore()
 * initializes the state and implements the update functions.
 * Author: Dipti Mahamuni
 */

import { create } from "zustand";

import { User } from "../logic/User";
import { Helper } from "../logic/Helper";
import { OperatingModes, PauseModes } from "../logic/Constants";
import { AppStateInterface, TNotification } from "../logic/AppLogic";
import { IVault, VaultTypes } from "../logic/Vault";
import { AccountVault } from "../logic/AccountVault";

export interface DerecState {
  user: User;
  appFlags: {
    operatingMode: OperatingModes;
    pauseMode: PauseModes;
  };
  vault: IVault;
  helpers: Array<Helper>;
  notifications: Array<TNotification>;
  qrCodesData: Array<Array<number>>;

  updateUser: (_user: User) => void;
  updateAppFlags: (_appFlags: any) => void;
  updateVault: (_vault: IVault) => void;
  updateHelpers: (_helpers: Array<Helper>) => void;
  updateNotifications: (_notifications: Array<TNotification>) => void;
  updateQRCodesData: (_qrCodesData: Array<Array<number>>) => void;
}

export const useDerecStore = create<DerecState>()((set) => ({
  user: new User("", ""),
  appFlags: {
    operatingMode: OperatingModes.Normal,
    pauseMode: PauseModes.Active,
  },
  vault: new AccountVault(),
  helpers: [],
  notifications: [],
  qrCodesData: [],
  updateUser: (_user: User) => set((state) => ({ user: _user })),
  updateAppFlags: (_appFlags: any) => set((state) => ({ appFlags: _appFlags })),
  updateVault: (_vault: IVault) => set((state) => ({ vault: _vault })),
  updateHelpers: (_helpers: Array<Helper>) => set((state) => ({ helpers: _helpers })),
  updateNotifications: (_notifications: Array<TNotification>) => set((state) => ({ notifications: _notifications })),
  updateQRCodesData: (_qrCodesData: Array<Array<number>>) => set((state) => ({ qrCodesData: _qrCodesData })),
}));
