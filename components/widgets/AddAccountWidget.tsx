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
 * Filename: AddAccountWidget.tsx
 * Description: Frontend modal component for adding a new account in the user's vault
 * Author: Dipti Mahamuni
 */

import React, { useState } from "react";
import { Text, Link, HStack, Center, Heading, Switch, useColorMode, NativeBaseProvider, extendTheme, VStack, Box, Pressable, FormControl, Input, Button, Icon, Modal, Select, CheckIcon, Spacer } from "native-base";
import { Platform } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { EcdsaKeys } from "../../logic/EcdsaKeys";
import { Ed25519Keys } from "../../logic/Ed25519Keys";
import { KeyTypes } from "../../logic/Key";

// import * as Random from "expo-random";

// import * as stableLibEd25519 from "@stablelib/ed25519";

const DEFAULT_ACCOUNT_ID = "NotApplicable";
export function AddAccountWidget(props) {
  // props:
  // callbacks:
  //    addHelperCallback(state, setstate, {name,phone})
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState(DEFAULT_ACCOUNT_ID);
  const [network, setNetwork] = useState("Hedera Mainnet");
  const [keyInputType, setKeyInputType] = useState("Import");
  const [keyType, setKeyType] = useState<KeyTypes>(KeyTypes.Ed25519);
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  function addAccountEntry() {
    props.callbacks.newAccountCallback(accountName, accountId, network, keyType, privateKey, publicKey);
    // const newAccountCallback = (accountName: string, network: string, keyType: KeyTypes, privateKeyStr: string, publicKeyStr: string) => {
  }

  function networkChanged(_network) {
    if (!["Hedera Mainnet", "Hedera Testnet"].includes(_network)) {
      setKeyType("" + KeyTypes.Ecdsa);
    }
    setNetwork(_network);
  }
  return (
    <Modal isOpen={props.showModal} avoidKeyboard placement="top" size="lg">
      <Modal.Content maxWidth="400px">
        <Modal.CloseButton onPress={() => props.callbacks.newAccountCallback(null, null, null, null, null, null)} />
        <Modal.Header> Add an Account </Modal.Header>
        <Modal.Body>
          <Input InputLeftElement={<Icon as={<MaterialIcons name="label-outline" />} size={5} ml="2" color="muted.400" />} placeholder="Account Name" onChangeText={setAccountName} />
          {["Hedera Mainnet", "Hedera Testnet"].includes(network) && <Input InputLeftElement={<Icon as={<MaterialIcons name="label-outline" />} size={5} ml="2" color="muted.400" />} placeholder="Account ID" onChangeText={setAccountId} />}

          <Select
            selectedValue={network}
            minWidth="200"
            accessibilityLabel="Choose Network"
            placeholder="Choose Network"
            _selectedItem={{ bg: "teal.600", endIcon: <CheckIcon size="5" /> }}
            mt={1}
            InputLeftElement={<Icon as={MaterialCommunityIcons} name="lan" size={5} ml="2" color="muted.400" />}
            onValueChange={(itemValue) => networkChanged(itemValue)}
          >
            <Select.Item label="Hedera Mainnet" value="Hedera Mainnet" />
            <Select.Item label="Hedera Testnet" value="Hedera Testnet" />
            <Select.Item label="Ethereum Goerli" value="Ethereum Goerli" />
            <Select.Item label="Ethereum Sepolia" value="Ethereum Sepolia" />
            <Select.Item label="Bitcoin" value="Bitcoin" />
          </Select>
          <Select
            selectedValue={keyType}
            minWidth="200"
            accessibilityLabel="Choose Key Type"
            placeholder="Choose Key Type"
            _selectedItem={{
              bg: "teal.600",
              endIcon: <CheckIcon size="5" />,
            }}
            mt={1}
            InputLeftElement={<Icon as={MaterialCommunityIcons} name="key-change" size={5} ml="2" color="muted.400" />}
            onValueChange={(itemValue) => setKeyType(itemValue)}
          >
            <Select.Item label="ED25519" value={"" + KeyTypes.Ed25519} />
            <Select.Item label="ECDSA" value={"" + KeyTypes.Ecdsa} />
          </Select>
          <Input InputLeftElement={<Icon as={MaterialCommunityIcons} name="key-outline" size={5} ml="2" color="muted.400" />} placeholder="Public Key" value={publicKey} onChangeText={(key) => setPublicKey(key)} />
          <Input InputLeftElement={<Icon as={MaterialCommunityIcons} name="key" size={5} ml="2" color="muted.400" />} placeholder="Private Key" value={privateKey} onChangeText={(key) => setPrivateKey(key)} />
          <Button
            onPress={async () => {
              let key;
              switch (keyType) {
                case KeyTypes.Ecdsa:
                  key = new EcdsaKeys();
                  break;
                case KeyTypes.Ed25519:
                default:
                  key = new Ed25519Keys();
                  break;
              }
              const privateKey = Buffer.from(key.privateKey).toString("hex");
              const publicKey = Buffer.from(key.publicKey).toString("hex");

              setPrivateKey(privateKey);
              setPublicKey(publicKey);
            }}
            _dark={{ backgroundColor: "gray.700" }}
            _web={{ shadow: 2, borderWidth: 0 }}
            _light={{ backgroundColor: "white" }}
            variant="outline"
            size="sm"
            mt="1"
            mb="3"
            ml="20"
            mr="20"
          >
            Generate Keys
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Spacer />
          <Button.Group space={2}>
            <Button
              onPress={() => {
                addAccountEntry();
              }}
              _dark={{ backgroundColor: "gray.700" }}
              _web={{ shadow: 2, borderWidth: 0 }}
              _light={{ backgroundColor: "green.500" }}
              variant="solid"
              isDisabled={accountName == "" || ((network == "Hedera Mainnet" || network == "Hedera Testnet") && accountId == DEFAULT_ACCOUNT_ID)}
            >
              Save
            </Button>
          </Button.Group>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
