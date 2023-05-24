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
 * Filename: VaultMain.tsx
 * Description: Frontend component for the Vault tab. Contains a FAB that is used to add an account to the vault using the AddAccountWidget.
 * Author: Dipti Mahamuni
 */

import React, { useState } from "react";

import { Fab, ScrollView, Modal, Heading, Button, Box, HStack, IconButton, Icon, Text, Center, VStack, DeleteIcon, Toast } from "native-base";
import { MaterialIcons } from "@expo/vector-icons";

import { NoAccountWidget } from "./widgets/NoAccountWidget";
import { AddAccountWidget } from "./widgets/AddAccountWidget";
import { RecoveryModeBannerWidget } from "./widgets/RecoveryModeBannerWidget";

import { useDerecStore } from "../utils/Store";
import { Account } from "../logic/Account.js";
import { KeyTypes, IKey } from "../logic/Key";
import { EcdsaKeys } from "../logic/EcdsaKeys";
import { Ed25519Keys } from "../logic/Ed25519Keys";
import { Constants, OperatingModes } from "../logic/Constants";
import { HelperStates } from "../logic/Helper";

function DisplayKey(props) {
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  return (
    <Modal isOpen={props.showModal} avoidKeyboard size="lg">
      <Modal.Content maxWidth="400px">
        <Modal.CloseButton onPress={() => props.callbacks.displayModalClosed(null)} />
        <Modal.Header width="80%"> {`${props.type} Key`} </Modal.Header>

        {/* <Modal.Body>{props.type == "Public" || (props.type == "Private" && showPrivateKey == true) ? Buffer.from(props.keyStr).toString("hex") : "*".repeat(props.keyStr.length)}</Modal.Body> */}
        <Modal.Body>{props.type == "Public" || (props.type == "Private" && showPrivateKey == true) ? `0x${Buffer.from(props.keyStr).toString()}` : "*".repeat(props.keyStr.length)}</Modal.Body>

        <Modal.Footer>
          <Button.Group space={2}>
            <>
              {props.type == "Private" && (
                <IconButton
                  size="sm"
                  colorScheme="trueGray"
                  icon={<Icon as={MaterialIcons} name={showPrivateKey ? "visibility-off" : "visibility"} color={"#0f0f0f"} size={5} />}
                  onPress={() => setShowPrivateKey(!showPrivateKey)}
                  textAlign="right"
                  alignSelf="flex-end"
                />
              )}
            </>

            <IconButton size="sm" colorScheme="trueGray" icon={<Icon as={MaterialIcons} name="content-copy" color={"#0f0f0f"} size={5} />} textAlign="right" alignSelf="flex-end" onPress={() => Toast.show({ title: "Key copied to clipboard" })} />
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
function AccountEntry(props) {
  const [showPublicKeyModal, setShowPublicKeyModal] = useState(false);
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);

  const formatKey = (key) => {
    key = Buffer.from(key).toString();
    return "0x" + (key.length > 20 ? key.substring(0, 2) + "................" + key.substring(key.length - 2) : key);
  };
  const formatPrivateKey = (key) => {
    key = Buffer.from(key).toString("hex");
    return key.length > 20 ? "*".repeat(10) + "*".repeat(16) + "*".repeat(10) : "*";
  };

  const displayModalClosed = () => {
    setShowPublicKeyModal(false);
    setShowPrivateKeyModal(false);
  };

  return (
    <Box
      borderBottomWidth="1"
      pl={["0", "4"]}
      pr={["0", "5"]}
      py="2"
      rounded="lg"
      overflow="hidden"
      borderColor="coolGray.200"
      borderWidth="1"
      _dark={{ borderColor: "coolGray.600", backgroundColor: "gray.700" }}
      _web={{ shadow: 2, borderWidth: 0 }}
      _light={{ backgroundColor: "gray.50" }}
      width="100%"
    >
      <VStack>
        <HStack space={[2, 3]} justifyContent="space-between">
          <Heading size="md" ml="2" width="70%">
            {props.account.name} {["Hedera Mainnet", "Hedera Testnet"].includes(props.account.network) ? `(${props.account.accountId})` : ""}
          </Heading>
          <IconButton
            size="sm"
            colorScheme="trueGray"
            icon={<DeleteIcon />}
            onPress={() => {
              props.appLogic.removeAccount(props.account.id);
            }}
            textAlign="right"
            alignSelf="flex-end"
          />
        </HStack>
        <Text
          fontSize="xs"
          _light={{
            color: "#3975F6",
          }}
          _dark={{
            color: "violet.400",
          }}
          fontWeight="500"
          ml="2"
          mt="-1"
        >
          {props.account.network} ({props.account.key.type})
        </Text>
        <Box ml="4">
          <HStack space={[2, 3]} justifyContent="space-between">
            <Box width="85%">
              <Heading size="sm">Public key</Heading>
              <Text>{formatKey(props.account.key.publicKey)}</Text>
            </Box>
            <IconButton size="sm" colorScheme="trueGray" icon={<Icon as={MaterialIcons} name={"open-in-new"} color={"#0f0f0f"} size={5} />} onPress={() => setShowPublicKeyModal(true)} textAlign="right" alignSelf="flex-end" />
          </HStack>
        </Box>
        <Box ml="4">
          <HStack space={[2, 3]} justifyContent="space-between">
            <Box width="85%">
              <Heading size="sm">Private key</Heading>
              <Text>{formatPrivateKey(props.account.key.privateKey)}</Text>
            </Box>
            <IconButton size="sm" colorScheme="trueGray" icon={<Icon as={MaterialIcons} name={"open-in-new"} color={"#0f0f0f"} size={5} />} onPress={() => setShowPrivateKeyModal(true)} textAlign="right" alignSelf="flex-end" />
          </HStack>
        </Box>
      </VStack>
      {showPublicKeyModal == true && <DisplayKey type="Public" keyStr={props.account.key.publicKey} showModal={showPublicKeyModal} callbacks={{ displayModalClosed: displayModalClosed }} />}
      {showPrivateKeyModal == true && <DisplayKey type="Private" keyStr={props.account.key.privateKey} showModal={showPrivateKeyModal} callbacks={{ displayModalClosed: displayModalClosed }} />}
    </Box>
  );
}

export function VaultMain(props) {
  const [showAddAccountWidgetModal, setShowAddAccountWidgetModal] = useState(false);
  const { vault, appFlags, helpers } = useDerecStore();

  const pairedHelpers = helpers.filter((h) => h.state == HelperStates.Paired);

  const newAccountCallback = (accountName: string, accountId: string, network: string, keyType: KeyTypes, privateKeyStr: string, publicKeyStr: string) => {
    setShowAddAccountWidgetModal(false);
    if (accountName == null) {
      return;
    }
    const key: IKey = keyType == KeyTypes.Ecdsa ? new EcdsaKeys() : new Ed25519Keys();
    if (privateKeyStr?.length != 0) {
      key.setKeys(Buffer.from(privateKeyStr), Buffer.from(publicKeyStr));
    }
    props.appLogic.addAccount(accountName, accountId, network, key);
  };

  return (
    <Box rounded="lg" p="3" _dark={{ bg: "coolGray.200:alpha.20" }} _light={{ bg: "coolGray.100" }} width="100%" height="100%">
      <Fab
        renderInPortal={true}
        shadow={2}
        size="sm"
        icon={<Icon color="white" as={MaterialIcons} name="add" size="lg" />}
        onPress={() => setShowAddAccountWidgetModal(true)}
        placement="bottom-right"
        bottom="12%"
        right="2"
        _dark={{ bg: "gray.400" }}
        _light={{ bg: "green.700" }}
        isDisabled={appFlags.operatingMode == OperatingModes.Recovery || (appFlags.operatingMode == OperatingModes.Normal && pairedHelpers.length < Constants.minNumOfHelpers)}
      />
      <ScrollView>
        <RecoveryModeBannerWidget />

        {vault.elements.length > 0 && (
          <Box>
            <Heading size="md" p="5">
              My accounts
            </Heading>
          </Box>
        )}
        <Center>
          {vault.elements.length == 0 && <NoAccountWidget />}
          {vault.elements.length > 0 && vault.elements.map((item: Account) => <AccountEntry account={item} appLogic={props.appLogic} key={`accountID_${item.id}`} />)}
        </Center>
        <Box>{showAddAccountWidgetModal == true && <AddAccountWidget showModal={showAddAccountWidgetModal} callbacks={{ ...props.callbacks, newAccountCallback: newAccountCallback }} />}</Box>
      </ScrollView>
    </Box>
  );
}
