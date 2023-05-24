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
 * Filename: HamburgerMenu.tsx
 * Description: Menu that enables user to change the theme of the app, control connectivity, 
 * and configure the minimum number of helpers required.
 * Author: Dipti Mahamuni
 */

import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Text, HStack, Heading, useColorMode, Box, Input, Spacer, Radio, Divider, Toast, Checkbox } from "native-base";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Constants, PauseModes } from "../../logic/Constants";
import { useDerecStore } from "../../utils/Store";

export function HamburgerMenu(props) {
  const [localPauseMode, setLocalPauseMode] = useState(PauseModes.Active);
  const [localMinNumHelpers, setLocalMinNumHelpers] = useState("3");
  const { colorMode, setColorMode } = useColorMode();
  const { appFlags, updateAppFlags } = useDerecStore();

  React.useEffect(function didMount() {
    setLocalPauseMode(appFlags.pauseMode);
    setLocalMinNumHelpers("" + Constants.minNumOfHelpers);
  }, []);

  const respondToPingsCheckboxClicked = (val) => {
    setLocalPauseMode(localPauseMode == PauseModes.Active ? PauseModes.Paused : PauseModes.Active);
    props.appLogic?.togglePauseMode();
  };

  const minNumHelpersUpdated = (value: string) => {
    console.log(`num helpers; [${value}]`);
    const intVal = parseInt(value) || 0;

    if (intVal < 3 && intVal != 0) {
      Toast.show({ title: "Minimum 3 helpers required!", placement: "top" });
    }
    setLocalMinNumHelpers(value);
    const settingVal = Math.max(intVal, 3);
    console.log(`setting value [${value}] or int [${intVal}], setting: ${settingVal}`);
    Constants.minNumOfHelpers = settingVal;
  };

  return (
    <Box style={[styles.expandedmenu]} _dark={{ bg: "grey" }} _light={{ bg: "white" }}>
      <Spacer mt="3" />

      <Heading size="sm" mb="1">
        Theme
      </Heading>

      <Radio.Group
        name="themeRadio"
        accessibilityLabel="themeRadio"
        onChange={(nextValue) => {
          setColorMode(nextValue);
        }}
      >
        <Radio value="dark" size="sm" my={1}>
          Dark Mode
        </Radio>
        <Radio value="light" size="sm" my={1}>
          Light Mode
        </Radio>
      </Radio.Group>

      <Spacer />
      <Divider mt="5" mb="5" />
      <Spacer />
      <Heading size="sm">Demo settings</Heading>
      <Spacer mb="2" />
      <HStack mr={5} mb={5}>
        <Text mr={5}>Respond to pings</Text>
        <Checkbox size="lg" isChecked={localPauseMode == PauseModes.Active} onChange={(val) => respondToPingsCheckboxClicked(val)} accessibilityLabel="Respond to Pings" value={"abc"} />
      </HStack>

      <HStack mr={5} mb="2">
        <Text mr={5} mb="2">
          Min Helper count
        </Text>
        <Input size="sm" width={10} variant="outline" value={localMinNumHelpers} onChangeText={(value) => minNumHelpersUpdated(value)} mt={-3} />
      </HStack>
      <Spacer mb="2" />
    </Box>
  );
}

const styles = StyleSheet.create({
  expandedmenu: {
    paddingLeft: 10,
    position: "absolute",
    zIndex: 30,
    alignSelf: "flex-end",
    top: 90,
    minWidth: "40%",
    // borderColor: "red",
    // borderWidth: 2,
  },
});
