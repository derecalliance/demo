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
 * Filename: NoAccountWidget.tsx
 * Description: Splash screen that is displayed on the Vault tab when there is an insufficient number of helpers.
 * Author: Dipti Mahamuni
 */

import React from "react";
import { Text, Center, Heading, Box } from "native-base";
import { useDerecStore } from "../../utils/Store";
import { Constants, OperatingModes } from "../../logic/Constants";
import { HelperStates } from "../../logic/Helper";

export function NoAccountWidget(props) {
  const {appFlags, helpers } = useDerecStore();

  const pairedHelpers = helpers.filter((h) => h.state == HelperStates.Paired);

  {pairedHelpers.length < Constants.minNumOfHelpers && (
    <Heading size="sm" p="5">
      You have not reached the minimum threshold of {Constants.minNumOfHelpers} helpers. Please add more helpers to ensure safety of your vault.
    </Heading>
  )}

  return (
    <Center>
      <Box w={[300, 400]} rounded="lg" p="5">
        <Box mt={10}>
          {appFlags.operatingMode == OperatingModes.Normal &&  pairedHelpers.length < Constants.minNumOfHelpers && ( 
            <Box>
            <Heading size="md" mb={50}>
              Adding accounts is disabled until you have paired with {Constants.minNumOfHelpers} helpers
            </Heading>
            <Text>Please go to the Helpers tab and pair with your helpers.</Text>
          </Box>
          )}

          {appFlags.operatingMode == OperatingModes.Normal &&  pairedHelpers.length >= Constants.minNumOfHelpers && (
            <Box>
              <Heading size="md" mb={50}>
                You have no accounts in the vault!
              </Heading>
              <Text>Please click on + button to add an account to your vault.</Text>
            </Box>
          )}
          {appFlags.operatingMode == OperatingModes.Recovery && (
            <Box>
              <Text>You are recovering your vault. You will not be able to add new accounts here until you finish the recovery process.</Text>
              <Text mt={10}>Please add at least half of your helpers similar to how you added them earlier. </Text>
              <Text mt={10}>When you pair with at least half of your original helpers, your vault and other helpers will automatically reappear in this application.</Text>
            </Box>
          )}
        </Box>
      </Box>
    </Center>
  );
}
