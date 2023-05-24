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
 * Filename: HelpMain.tsx
 * Description: Frontend component for the Helpers tab. Contains a FAB which initiates the pairing process.
 * Author: Dipti Mahamuni
 */

import React, { useState } from "react";

import { Box, Fab, ScrollView, Heading, Icon } from "native-base";
import { MaterialIcons } from "@expo/vector-icons";

import { useDerecStore } from "../utils/Store";
import { Helper, HelperStates } from "../logic/Helper";
import { RecoveryModeBannerWidget } from "./widgets/RecoveryModeBannerWidget";
import { NoHelpersWidget } from "./widgets/NoHelpersWidget";
import { HelpListWidget } from "./widgets/HelpListWidget";
import { Constants, OperatingModes } from "../logic/Constants";
import { PairingWidget } from "./widgets/PairingWidget";

export function HelpMain(props) {
  const { helpers, updateHelpers } = useDerecStore();
  const [showPairingWidget, setShowPairingWidget] = useState(false);

  const pairedHelpers = helpers.filter((h) => h.state == HelperStates.Paired);

  function startPairingProcess() {
    props.appLogic.startPairingProcess();
    props.callbacks["ChangeTimerPeriod"](5000);

    setShowPairingWidget(true);
  }

  const pairingWidgetClosedCallback = () => {
    console.log(`in pairingWidgetClosedCallback`);
    props.appLogic.removeHelperByPhone(Constants.unknownUserForPairing.phone);
    setShowPairingWidget(false);
    props.callbacks["ChangeTimerPeriod"](1000);
  };

  const pairingCompletedCallback = () => {
    console.log(`in pairingCompletedCallback`);
    setShowPairingWidget(false);
    props.callbacks["ChangeTimerPeriod"](1000);
  };

  const qrCodeScannedCallback = () => {
    console.log(`in qrCodeScannedCallback`);
  };

  const scannedConsecutiveQrCodesCallback = () => {
    console.log(`in scannedConsecutiveQrCodesCallback`);
  };

  return (
    <Box rounded="lg" p="3" _dark={{ bg: "coolGray.200:alpha.20" }} _light={{ bg: "coolGray.100" }} width="100%" height="100%">
      <Fab
        renderInPortal={true}
        shadow={2}
        size="sm"
        icon={<Icon color="white" as={MaterialIcons} name="add" size="lg" />}
        onPress={() => startPairingProcess()}
        placement="bottom-right"
        bottom="12%"
        right="2"
        _dark={{ bg: "gray.400" }}
        _light={{ bg: "green.700" }}
        area-label="helpMainFab"
      />
      <PairingWidget
        showModal={showPairingWidget}
        appLogic={props.appLogic}
        callbacks={{
          pairingCompletedCallback: pairingCompletedCallback,
          pairingWidgetClosedCallback: pairingWidgetClosedCallback,
          qrCodeScannedCallback: qrCodeScannedCallback,
          scannedConsecutiveQrCodesCallback: scannedConsecutiveQrCodesCallback,
        }}
      />
      <ScrollView>
        <RecoveryModeBannerWidget />

        {pairedHelpers.length == 0 && <NoHelpersWidget />}
        {pairedHelpers.length > 0 && (
          <Box>
            <Box>
              <Heading size="md" p="5">
                My Helpers
              </Heading>
              <Box>
                {pairedHelpers.length < Constants.minNumOfHelpers && (
                  <Heading size="sm" p="5">
                    You have not reached the minimum threshold of {Constants.minNumOfHelpers} helpers. Please add more helpers to ensure safety of your vault.
                  </Heading>
                )}
              </Box>
              <HelpListWidget
                emptyListCaption=""
                list={pairedHelpers}
                appLogic={props.appLogic}
                callbacks={{
                  ...props.callbacks,
                  removePeerCallback: (phone: string) => {
                    updateHelpers(helpers.filter((h: Helper) => h.user.phone != phone));
                  },
                }}
              />
            </Box>
          </Box>
        )}
      </ScrollView>
    </Box>
  );
}
