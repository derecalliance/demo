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
 * Filename: NoHelpersWidget.tsx
 * Description: Splash screen that is displayed on the Helpers tab when there are no helpers.
 * Author: Dipti Mahamuni
 */

import React from "react";
import { Text, Center, Heading, Box } from "native-base";
import { useDerecStore } from "../../utils/Store";
import { OperatingModes } from "../../logic/Constants";

export function NoHelpersWidget(props) {
  const { appFlags } = useDerecStore();

  return (
    <Center>
      <Box w={[300, 400]} rounded="lg" p="5">
        <Box mt={10}>
          <Box>
            <Heading size="md" mb={50}>
              You have no helpers yet!
            </Heading>
            {appFlags.operatingMode == OperatingModes.Normal && (
              <>
                <Text>Please click on + button to add a helper.</Text>
              </>
            )}
            {appFlags.operatingMode == OperatingModes.Recovery && (
              <>
                <Heading size="sm">Recovery</Heading>
                <Text mt={10}>As you are attempting to recover your vault of accounts and keys, please add at least half of your helpers similar to how you added them earlier. </Text>
                <Text mt={10}>When at least half of your helpers pair with you, your vault and other helpers will atomatically reappear in this application.</Text>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Center>
  );
}
