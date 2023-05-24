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
 * Filename: MainFrameWidget.tsx
 * Description: Frontend component for the top (TopBarWidget) and bottom bars of the application. 
 * Toast notifications are displayed here.
 * Author: Dipti Mahamuni
 */

import React, { useEffect, useState } from "react";

import { Box, HStack, Icon, Text, Center, VStack, Pressable, Toast, Badge } from "native-base";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TopBarWidget } from "./TopBarWidget";
import { useDerecStore } from "../../utils/Store";
import { VaultMain } from "../VaultMain";
import { HelpMain } from "../HelpMain";
import { AboutMain } from "../AboutMain";
import { DebugMain } from "../DebugMain";
import { HelperStates } from "../../logic/Helper";
import { Constants } from "../../logic/Constants";
import { HamburgerMenu } from "./HamburgerMenu";
import { NotificationMain } from "../NotificationMain";

// primary: "#3EB649",
// secondary: "#3873F2",

export function MainFrameWidget(props) {
  const [selected, setSelected] = useState(0);
  const { helpers, updateHelpers } = useDerecStore();
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  useEffect(() => {
    props.appLogic.registerToastCallback(showToast);
    const pairedHelpers = helpers.filter((h) => h.state == HelperStates.Paired);
    if (pairedHelpers.length < Constants.minNumOfHelpers) {
      setSelected(1);
    } else {
      setSelected(0);
    }
  }, []);

  const showToast = (title: string, description: string) => {
    Toast.show({ description: description, title: title });
  };
  const hamburgerMenuClicked = () => {
    setShowHamburgerMenu(!showHamburgerMenu);
    console.log(`hb menu clicked: ${showHamburgerMenu}`);
  };

  return (
    <>
      <Box flex={1} _dark={{ bg: "#262836" }} _light={{ bg: "#3EB649" }} safeAreaTop width="100%" alignSelf="center">
        <TopBarWidget appLogic={props.appLogic} hamburgerMenuClicked={hamburgerMenuClicked} />
        {showHamburgerMenu && <HamburgerMenu appLogic={props.appLogic} />}

        <Center flex={1}>
          <Box rounded="lg" p="5" _dark={{ bg: "coolGray.200:alpha.20" }} _light={{ bg: "coolGray.100" }} width="100%" height="100%">
            {selected == 0 && <VaultMain appLogic={props.appLogic} />}
            {selected == 1 && <HelpMain appLogic={props.appLogic} callbacks={props.callbacks} />}
            {selected == 2 && <NotificationMain appLogic={props.appLogic} callbacks={props.callbacks} />}
            {selected == 3 && <AboutMain appLogic={props.appLogic} />}
            {/* {selected == 3 && <DebugMain appLogic={props.appLogic} />} */}
          </Box>
        </Center>

        <HStack _dark={{ bg: "#262836" }} _light={{ bg: "#3EB649" }} alignItems="center" safeAreaBottom shadow={6}>
          <Pressable opacity={selected === 0 ? 1 : 0.5} py="3" flex={1} onPress={() => setSelected(0)}>
            <Center>
              <Icon mb="1" as={<MaterialCommunityIcons name={selected === 0 ? "wallet" : "wallet"} />} color="white" size="lg" alignItems={"center"} alignSelf="center" />
              <Text color="white" fontSize="12">
                Vault
              </Text>
            </Center>
          </Pressable>

          <Pressable opacity={selected === 1 ? 1 : 0.5} py="2" flex={1} onPress={() => setSelected(1)}>
            <Center>
              <VStack>
                <Icon mb="1" as={<MaterialCommunityIcons name={selected === 0 ? "account-multiple" : "account-multiple"} />} color="white" size="lg" alignItems={"center"} alignSelf="center" />
                <Text color="white" fontSize="12">
                  Helpers
                </Text>
              </VStack>
            </Center>
          </Pressable>

          <Pressable opacity={selected === 2 ? 1 : 0.5} py="2" flex={1} onPress={() => setSelected(2)}>
            <Center>
              <VStack>
                {props.appLogic.notifications.length > 0 && (
                  <Badge // bg="red.400"
                    colorScheme="danger"
                    rounded="full"
                    mb={-4}
                    mr={-1}
                    zIndex={1}
                    variant="solid"
                    alignSelf="flex-end"
                    _text={{
                      fontSize: 12,
                    }}
                  >
                    {props.appLogic.notifications.length}
                  </Badge>
                )}
                <Icon mb="1" as={<MaterialCommunityIcons name={selected === 0 ? "bell" : "bell-outline"} />} color="white" size="lg" alignItems={"center"} alignSelf="center" />
                <Text color="white" fontSize="12">
                  Notifications
                </Text>
              </VStack>
            </Center>
          </Pressable>

          <Pressable opacity={selected === 3 ? 1 : 0.6} py="2" flex={1} onPress={() => setSelected(3)}>
            <Center>
              <Icon mb="1" as={<MaterialCommunityIcons name={selected === 2 ? "bell" : "bell-outline"} />} color="white" size="lg" alignItems={"center"} alignSelf="center" />
              <Text color="white" fontSize="12">
                About
              </Text>
            </Center>
          </Pressable>

          {/* <Pressable opacity={selected === 3 ? 1 : 0.6} py="2" flex={1} onPress={() => setSelected(3)}>
            <Center>
              <Icon mb="1" as={<MaterialCommunityIcons name={selected === 3 ? "bell" : "bell-outline"} />} color="white" size="lg" />
              <Text color="white" fontSize="12">
                Debug
              </Text>
            </Center>
          </Pressable> */}
        </HStack>
      </Box>
    </>
  );
}
