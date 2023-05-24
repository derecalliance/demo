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
 * Filename: RecoveryModeBannerWidget.tsx
 * Description: Frontend component for banner that is displayed when the user is in recovery mode. 
 * This widget disappears when the user is no longer in recovery mode and has moved to normal mode.
 * Author: Dipti Mahamuni
 */

import React from "react";
import { Text, HStack, WarningIcon } from "native-base";

import { useDerecStore } from "../../utils/Store";
import { OperatingModes } from "../../logic/Constants";

export function RecoveryModeBannerWidget(props) {
  const { appFlags } = useDerecStore();

  return (
    <>
      {appFlags.operatingMode == OperatingModes.Recovery && (
        <HStack bg="yellow.500" p={10}>
          <WarningIcon size="lg" color="red.500" />
          <Text ml={15}>You are recovering your vault</Text>
        </HStack>
      )}
    </>
  );
}
