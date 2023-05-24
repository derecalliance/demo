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
 * Filename: HelpListWidget.tsx
 * Description: Frontend component that displays the list of helpers a user has. The list of helpers is divided into two 
 * subsets, active helpers and inactive helpers.
 * Author: Dipti Mahamuni
 */

import React, { useEffect, useState } from "react";
import { Text, HStack, VStack, Box, ScrollView, Avatar, Spacer, IconButton, DeleteIcon, Icon, Heading } from "native-base";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { NoHelpersWidget } from "./NoHelpersWidget";
import { Helper, HelperStates } from "../../logic/Helper";
import { formatPhoneNumber } from "../../logic/utils";

function DisplayOneHelpList(props) {
  function createInitials(name: string): string {
    return name
      .split(" ")
      .map((str) => str[0])
      .join("");
  }

  return (
    <Box>
      {props.list.map((item: Helper) => (
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
          _light={{ backgroundColor: item.state == HelperStates.Paired && item.inSyncFlag == false ? "red.100" : "gray.50" }}
          key={`phone-${item.user.phone}`}
        >
          <HStack space={[2, 3]} justifyContent="space-between">
            <Avatar size="48px" bg="green.500" mr="1">
              {createInitials(item.user.name)}
            </Avatar>

            <VStack>
              <Text _dark={{ color: "warmGray.50" }} color="coolGray.800" bold>
                {item.user.name}
              </Text>
              <Text color="coolGray.600" _dark={{ color: "warmGray.200" }}>
                {formatPhoneNumber(item.user.phone)}
              </Text>
              <Text color="coolGray.400" fontSize="xs" _dark={{ color: "coolGray.100" }}>
                {item.lastSyncTime ? `Last contact: ${new Date(item.lastSyncTime * 1000).toLocaleDateString()}  ${new Date(item.lastSyncTime * 1000).toLocaleTimeString()}` : `Please link with this helper`}
              </Text>
            </VStack>
            <Spacer />
            <VStack>
              <Box>
                <VStack textAlign="right" alignSelf="flex-end">
                  {item.state == HelperStates.Paired && item.inSyncFlag == true && <Icon as={MaterialCommunityIcons} name="link-lock" color={"green.800"} size={30} />}
                  {item.state == HelperStates.Paired && item.inSyncFlag == false && <Icon as={MaterialCommunityIcons} name="link-off" color={"red.800"} size={30} />}
                  <IconButton size="sm" colorScheme="trueGray" icon={<DeleteIcon />} onPress={() => props.appLogic.deleteHelperUserCommand(item.user.phone)} textAlign="right" alignSelf="flex-end" />
                </VStack>
              </Box>
            </VStack>
          </HStack>
        </Box>
      ))}
    </Box>
  );
}

export function HelpListWidget(props) {
  const [list, setList] = useState<Array<Helper>>([]);
  const [healthyHelpers, setHealthyHelpers] = useState<Array<Helper>>([]);
  const [unHealthyHelpers, setUnHealthyHelpers] = useState<Array<Helper>>([]);

  useEffect(() => {
    if (props.list?.length >= 0) {
      const sortedList = props.list.sort((x: Helper, y: Helper) => (x.user.name > y.user.name ? 1 : -1));
      let updatedList = sortedList;
      if (sortedList?.length > 0) {
        const deduplicatedList = sortedList.filter((h: Helper, index: number) => h?.user?.name != sortedList[index + 1]?.user?.name);
        updatedList = deduplicatedList.filter((h: Helper) => h.state == HelperStates.Paired);
        setList(updatedList);
      }
      setHealthyHelpers(updatedList.filter((h) => h.inSyncFlag == true));
      setUnHealthyHelpers(updatedList.filter((h) => h.inSyncFlag == false));
    }
  }, [props, props.list.length]);

  return (
    <ScrollView>
      {list.length == 0 && <NoHelpersWidget />}

      {healthyHelpers.length > 0 && (
        <>
          <Heading size="sm" p="5">
            Active Helpers
          </Heading>
          <DisplayOneHelpList list={healthyHelpers} appLogic={props.appLogic}/>
        </>
      )}
      {unHealthyHelpers.length > 0 && (
        <>
          <Heading size="sm" p="5">
            Inactive Helpers
          </Heading>
          <DisplayOneHelpList list={unHealthyHelpers} appLogic={props.appLogic}/>
        </>
      )}
    </ScrollView>
  );
}
