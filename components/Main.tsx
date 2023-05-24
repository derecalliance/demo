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
 * Filename: Main.tsx
 * Description: Displays FirstDownloadWidget or MainFrame depending on whether the user has signed in.
 * Updates the Zustand state according to data from AppLogic when periodicTask executes.
 * Author: Dipti Mahamuni
 */

import React, { useState, useEffect } from "react";
import { Platform, LogBox } from "react-native";
import { Box } from "native-base";

import { CallbackFunctions } from "../logic/CallbackFunctions";

import { AppLogic } from "../logic/AppLogic";
// import { normalizePhoneNumber } from "../logic/utils";
import { FirstDownloadWidget } from "./widgets/FirstDownloadWidget";
import { useDerecStore } from "../utils/Store";
import { MainFrameWidget } from "./widgets/MainFrameWidget";

export default function Main() {
  const [appLogic, setAppLogic] = useState<AppLogic>();
  const [timerPeriod, setTimerPeriod] = useState(1000);
  const [timerObject, setTimerObject] = useState<NodeJS.Timer>();

  const { user, updateUser, updateAppFlags, updateVault, updateHelpers, updateNotifications, updateQRCodesData } = useDerecStore();

  useEffect(() => {
    // Ignore the warning issued by switch component in Appbar
    LogBox.ignoreLogs(["We can not support a function callback. See Github Issues for details https://github.com/adobe/react-spectrum/issues/2320"]);
    const logic = new AppLogic(mainCallbacks);
    setAppLogic(logic);
  }, []);

  useEffect(() => {
    appLogic?.setCallbacks(mainCallbacks);
    if (timerObject) {
      clearInterval(timerObject);
    }
    const timerObj: NodeJS.Timer = setInterval(() => mainLoop(), timerPeriod);
    setTimerObject(timerObj);
    return () => clearInterval(timerObj);
  }, [appLogic, timerPeriod]);

  const updateZuestandState = (): void => {
    //Get state from appLogic object and upate the zuestand state for the UI components
    if (!appLogic) {
      return;
    }
    const state = appLogic.appState();
    updateUser(state.user);
    updateAppFlags(state.appFlags);
    updateVault(state.vault);
    updateHelpers(state.helpers);
    updateNotifications(state.notifications);
    updateQRCodesData(state.qrCodesData);
  };
  const mainLoop: Function = (): void => {
    if (!appLogic) {
      return;
    }
    appLogic.handlePeriodicTasks();
    updateZuestandState();
  };

  const mainCallbacks: CallbackFunctions = {
    SignIn: (name, phone, operatingMode) => {
      // phone = normalizePhoneNumber(phone);
      // console.log(`in mainCallBack phone is: ${JSON.stringify(phone)}`);
      appLogic?.setUser(name, phone);
      appLogic?.setOperatingMode(operatingMode);
      if (Platform.OS !== "ios" && Platform.OS !== "android") {
        document.title = name;
      }
    },
    ChangeTimerPeriod: (period) => {
      setTimerPeriod(period);
    },
    updateZuestandState: updateZuestandState,
  };

  return (
    <>
      {(!user || !user.name || !user.phone) && (
        <Box h="100%">
          <FirstDownloadWidget callback={(name, phone, operatingMode) => mainCallbacks["SignIn"](name, phone, operatingMode)} />
        </Box>
      )}
      {user != null && user.name && user.phone && <MainFrameWidget appLogic={appLogic} callbacks={mainCallbacks} />}
    </>
  );
}
