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
 * Filename: NotificationMain.tsx
 * Description: Frontend component that displays the NotificationListWidget on the Notifications tab.
 * Author: Dipti Mahamuni
 */

import React, { useState } from "react";

import { Box, Fab, ScrollView, Heading, Icon, Text } from "native-base";

import { useDerecStore } from "../utils/Store";
import { NotificationListWidget } from "./widgets/NotificationListWidget";

export function NotificationMain(props) {
  const { notifications, updateNotifications } = useDerecStore();

  return (
    <Box rounded="lg" p="3" _dark={{ bg: "coolGray.200:alpha.20" }} _light={{ bg: "coolGray.100" }} width="100%" height="100%">
      <ScrollView>
        <NotificationListWidget list={notifications} appLogic={props.appLogic} callbacks={props.callbacks} />
      </ScrollView>
    </Box>
  );
}
