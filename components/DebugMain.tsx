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
 * Filename: DebugMain.tsx
 * Description: Frontend component used for debugging purposes. 
 * Author: Dipti Mahamuni
 */

import React from "react";

import { Button, Text, useColorMode, ScrollView } from "native-base";

import { useDerecStore } from "../utils/Store";
import { Helper } from "../logic/Helper";

export function DebugMain(props) {
  const { user, appFlags, vault, helpers, qrCodesData } = useDerecStore();

  return (
    <ScrollView>
      <Button mt="2" onPress={() => props.appLogic.generateVaultShares()} bg="green.700">
        Generate Vault Shares
      </Button>

      <Text> User: {JSON.stringify(user)}</Text>
      <Text> appFlags: {JSON.stringify(appFlags)}</Text>
      <Text> vault: {JSON.stringify(vault)}</Text>
      <Text>Helpers:</Text>
      {helpers.map((item: Helper) => (
        <Text key={item.user.phone}>{item.toString(false)}</Text>
      ))}
      <Text> qrCodesData: {JSON.stringify(qrCodesData)}</Text>
    </ScrollView>
  );
}
