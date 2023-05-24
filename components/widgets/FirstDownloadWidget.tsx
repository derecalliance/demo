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
 * Filename: FirstDownloadWidget.tsx
 * Description: Frontend component for user sign in for the demo
 * Author: Dipti Mahamuni
 */

import React, { Component, useState, useEffect } from "react";
import { Heading, Box, Center, VStack, FormControl, Input, Link, AlertDialog, Image, Button, Text, Spacer, HStack, Square, View, ScrollView, Toast, Select, CheckIcon } from "native-base";
import { Platform } from "react-native";

import { Constants, OperatingModes } from "../../logic/Constants";

export function FirstDownloadWidget(props) {
  const [username, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [isRecoverAlertOpen, setIsRecoverAlertOpen] = useState(false);
  const [userInfoEntered, setUserInfoEntered] = useState(false);
  const cancelRef = React.useRef(null);

  const onRecoverAlertClose = () => setIsRecoverAlertOpen(false);
  const startButtonPressed = () => {
    console.log(`start button pressed`);
    if (!username || !phone) {
      const devMode = false;
      if (devMode) {
        props.callback(Platform.OS, "" + Platform.OS.split("").reduce((sum, e) => e.charCodeAt(0) + sum, 0), OperatingModes.Normal);
        return;
      }
      Toast.show({ title: "Please enter your name and phone number" });
    } else {
      const normalizedPhone = phone.replace(/[+\- \(\)]/g, "");
      props.callback(username, normalizedPhone, OperatingModes.Normal);
    }
  };
  const recoverButtonPressed = () => {
    console.log(`recover button pressed`);
    setIsRecoverAlertOpen(!isRecoverAlertOpen);
  };

  const recoveryOptionConfirmed = () => {
    onRecoverAlertClose();
    if (!username || !phone) {
      Toast.show({ title: "Please enter your name and phone number" });
    } else {
      const normalizedPhone = phone.replace(/[+\- \(\)]/g, "");
      props.callback(username, normalizedPhone, OperatingModes.Recovery);
    }
  };

  const phoneNumberChanged = (_phone) => {
    _phone = _phone.replace(/[ \.-]/g, "");
    _phone = _phone.replace(/^(\d{3})/, "($1) ");
    _phone = _phone.replace(/^\((\d{3})\)(\d{3})/, "($1) $2");
    _phone = _phone.replace(/^\((\d{3})\) (\d{3})(\d+)$/, "($1) $2-$3");
    // console.log(`in firstdownloadwidget phoneNumberChanged phone is: ${JSON.stringify(_phone)}`);

    setPhone(_phone);
  };

  React.useEffect(function didMount() {
    setUserName(props.username);
    setPhone(props.phone);
  }, []);

  return (
    <Center w="100%" h="100%" bg="#3EB649">
      <Box safeArea p="2" w="90%" maxW="290" py="8">
        <Center>
          <Box alignContent="flex-start" alignItems="flex-start">
            <Image source={require("../../assets/SLLogoTransparent.png")} alt="Swirlds Labs" size="md" alignSelf="flex-start" alignContent="flex-start" alignItems="flex-start" />
          </Box>
          <Image source={require("../../assets/deRecBanner.png")} alt="banner" size="md" w="100%" alignSelf="flex-start" alignContent="flex-start" alignItems="flex-start" />
          <Text color="green.300">Version: {Constants.softwareVersion}</Text>
        </Center>

        {!userInfoEntered && (
          <VStack space={3} mt="5">
            <Spacer mb="10" />
            <FormControl>
              <FormControl.Label>
                <Text color="white">Name</Text>
              </FormControl.Label>
              <Box rounded="xl" bg="white">
                <Input variant="underlined" onChangeText={setUserName} p={3} w="90%" ml={2} mr={2} />
              </Box>
            </FormControl>
            <FormControl>
              <FormControl.Label>
                <Text color="white">Phone</Text>
              </FormControl.Label>
              <Box rounded="xl" bg="white">
                <Input variant="underlined" onChangeText={phoneNumberChanged} p={3} w="90%" ml={2} mr={2} value={phone || ""} />
              </Box>
            </FormControl>
            <Spacer mb="5" />
            <Button mt="2" onPress={() => setUserInfoEntered(true)} bg="green.700">
              Start Decentralized Recovery Demo
            </Button>
            <Spacer mb="40" />
          </VStack>
        )}
        {userInfoEntered && (
          <VStack>
            <Spacer mb="20" />
            <Center>
              <Text color="white" italic>
                If you are running this app for the first time, please start in Normal Mode
              </Text>
              <Text color="white" italic>
                If you are attempting to recover your vault, please start in Recovery Mode
              </Text>
            </Center>
            <Spacer mb="10" />
            <Button mt="2" onPress={() => startButtonPressed()} bg="green.700">
              Start in Normal Mode
            </Button>
            <Button mt="2" onPress={() => recoverButtonPressed()} bg="red.700">
              Start in Recovery Mode
            </Button>

            <Spacer />
            <Box alignContent={"flex-end"} alignSelf="flex-end">
              <HStack alignContent={"center"} alignItems="center">
                <AlertDialog leastDestructiveRef={cancelRef} isOpen={isRecoverAlertOpen} onClose={onRecoverAlertClose}>
                  <AlertDialog.Content>
                    <AlertDialog.CloseButton />
                    <AlertDialog.Header> Vault Recovery</AlertDialog.Header>
                    <AlertDialog.Body>
                      <Text> This will recover your vault information from your helpers. </Text>
                      <Text mt={5}> During this process, your vault will be overwritten with the information received from your helpers.</Text>
                      <Text mt={5} fontWeight={"bold"}>
                        This action cannot be reversed.
                      </Text>
                    </AlertDialog.Body>
                    <AlertDialog.Footer>
                      <Button.Group space={2}>
                        <Button variant="unstyled" colorScheme="coolGray" onPress={onRecoverAlertClose} ref={cancelRef}>
                          Cancel
                        </Button>
                        <Button
                          bg="#059669"
                          onPress={() => {
                            recoveryOptionConfirmed();
                          }}
                        >
                          Recover my vault
                        </Button>
                      </Button.Group>
                    </AlertDialog.Footer>
                  </AlertDialog.Content>
                </AlertDialog>
              </HStack>
            </Box>
          </VStack>
        )}
      </Box>
    </Center>
  );
}
