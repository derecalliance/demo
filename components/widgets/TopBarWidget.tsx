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
 * Filename: TopBarWidget.tsx
 * Description: Frontend component for the top bar of the application.
 * Author: Dipti Mahamuni
 */

import React from "react";

import { Box, HStack, Text, Image, Center, VStack, useColorMode, Menu, Switch, Pressable, HamburgerIcon, Button, Icon } from "native-base";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { useDerecStore } from "../../utils/Store";
import { PauseModes } from "../../logic/Constants";
import { SafeAreaView } from "react-native";
import { HamburgerMenu } from "./HamburgerMenu";

// primary: "#3EB649",
// secondary: "#3873F2",

export function TopBarWidget(props) {
  const { colorMode, setColorMode } = useColorMode();
  const { appFlags, updateAppFlags } = useDerecStore();

  // const respondToPingsChanged = (val) => {
  //   console.log(`Pause state: ${val}`);
  //   props.appLogic?.togglePauseMode();
  // };

  return (
    <>
      <SafeAreaView>
        <VStack>
          <VStack _dark={{ bg: "#262836" }} _light={{ bg: "#3EB649" }} px="1" py="3" w="100%" space={3} mb="2">
            <Box alignContent="flex-start" alignItems="flex-start">
              <Image source={require("../../assets/SLLogoTransparent.png")} alt="Swirlds Labs" size="xs" alignSelf="flex-start" alignContent="flex-start" alignItems="flex-start" />
            </Box>
            <Center>
              <Text color="white" fontSize="18" fontWeight="bold" mt="-75">
                Decentralized Recovery
              </Text>
            </Center>
            <Box alignContent="flex-end" alignItems="flex-end" mt="-60" mr="-5">
              <Button size="sm" variant={"ghost"} leftIcon={<Icon as={MaterialIcons} name="menu" color={"white"} size={7} mt={-2} />} onPress={() => props.hamburgerMenuClicked()} textAlign="right" alignSelf="flex-end" mr="5" />

              {/* <Menu
                closeOnSelect={true}
                w="190"
                defaultIsOpen={false}
                trigger={(triggerProps) => {
                  return (
                    <Pressable {...triggerProps}>
                      <HamburgerIcon size="md" mr="10" color="white" />
                    </Pressable>
                  );
                }}
              >
                <Menu.OptionGroup defaultValue={"x"} title="Color Mode" type="radio">
                  <Menu.ItemOption value="dark" onPress={() => setColorMode("dark")}>
                    Dark Mode
                  </Menu.ItemOption>
                  <Menu.ItemOption value="light" onPress={() => setColorMode("light")}>
                    Light Mode
                  </Menu.ItemOption>
                </Menu.OptionGroup>

                <Menu.OptionGroup title="Demo" type="radio">
                  <Center>
                    <HStack>
                      <Text mr={5}>Respond to pings</Text>
                      <Switch isChecked={appFlags?.pauseMode == PauseModes.Active} colorScheme="primary" onValueChange={(val) => respondToPingsChanged(val)} />
                    </HStack>
                  </Center>
                </Menu.OptionGroup>
              </Menu> */}
            </Box>
          </VStack>
          <Center mt="-5" mb="2">
            <Text fontSize="16" color="white">
              {props.appLogic?.user?.name}
            </Text>
          </Center>
        </VStack>
      </SafeAreaView>
    </>
  );
}
