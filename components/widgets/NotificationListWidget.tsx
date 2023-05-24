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
 * Filename: NotificationListWidget.tsx
 * Description: Frontend component that displays a list of notifications on the Notifications tab.
 * Author: Dipti Mahamuni
 */
import React, { useEffect, useState } from "react";
import { Text, HStack, VStack, Box, ScrollView, Avatar, Spacer, IconButton, DeleteIcon, Icon, Heading, Center, Spinner, Button } from "native-base";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { TNotification } from "../../logic/AppLogic";

function NoNotificationsWidget() {
  return (
    <Center>
      <Box w={[300, 400]} rounded="lg" p="5">
        <Heading size="md" mb={50}>
          You have no unread notifications!
        </Heading>
      </Box>
    </Center>
  );
}

export function NotificationListWidget(props) {
  // const [showSpinner, setShowSpinner] = useState(false);

  function deleteNotification(props: any, ts: number) {
    // setShowSpinner(true);
    // setTimeout(() => setShowSpinner(false), 2000);
    props.appLogic.deleteNotification(ts);
    props.callbacks["updateZuestandState"]();
  }

  function deleteAllNotifications(props: any) {
    // setShowSpinner(true);
    // setTimeout(() => setShowSpinner(false), 2000);
    props.appLogic.deleteAllNotifications();
    props.callbacks["updateZuestandState"]();
  }

  return (
    <ScrollView>
      {props.list.length == 0 && <NoNotificationsWidget />}

      {props.list.length > 0 && (
        <>
          <HStack>
            <Heading size="sm" p="5">
              Notifications
            </Heading>
            <Spacer />
            <Button size="sm" colorScheme="trueGray" onPress={() => deleteAllNotifications(props)} textAlign="right" alignSelf="flex-end" mb={3}>
              Clear all
            </Button>
          </HStack>
          {/* {showSpinner && <Spinner size={"lg"} />} */}
          <Box>
            {props.list
              .sort((a, b) => b.ts - a.ts)
              .map((item: TNotification) => (
                <Box
                  borderBottomWidth="1"
                  pl={["2", "4"]}
                  pr={["2", "5"]}
                  py="2"
                  rounded="lg"
                  overflow="hidden"
                  borderColor="coolGray.200"
                  borderWidth="1"
                  _dark={{ borderColor: "coolGray.600", backgroundColor: "gray.700" }}
                  _web={{ shadow: 2, borderWidth: 0 }}
                  _light={{ backgroundColor: "gray.50" }}
                  key={`notification-${item.ts}`}
                >
                  <HStack space={[2, 3]} justifyContent="space-between">
                    <VStack maxW={"80%"}>
                      <HStack>
                        <Text color="coolGray.400" fontSize="xs" _dark={{ color: "coolGray.100" }}>
                          {`${new Date(item.ts).toLocaleDateString()} ${new Date(item.ts).toLocaleTimeString()} `}
                        </Text>
                      </HStack>
                      <Text _dark={{ color: "warmGray.50" }} color="coolGray.800" bold>
                        {item.title}
                      </Text>
                      <Text color="coolGray.600" _dark={{ color: "warmGray.200" }}>
                        {item.description}
                      </Text>
                    </VStack>
                    <Spacer />
                    <VStack>
                      <Box>
                        <VStack textAlign="right" alignSelf="flex-end">
                          <IconButton size="sm" colorScheme="trueGray" icon={<DeleteIcon />} onPress={() => deleteNotification(props, item.ts)} textAlign="right" alignSelf="flex-end" />
                        </VStack>
                      </Box>
                    </VStack>
                  </HStack>
                </Box>
              ))}
          </Box>
        </>
      )}
    </ScrollView>
  );
}
