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
 * Filename: AboutMain.tsx
 * Description: Frontend component for the About tab. Contains text about DeRec and how it works.
 * Author: Dipti Mahamuni
 */

import React from "react";

import { Box, Text, Center, VStack, ScrollView, Heading } from "native-base";

export function AboutMain(props) {
  return (
    <ScrollView>
      <Center>
        <Box
          rounded="lg"
          p="5"
          _dark={{ bg: "coolGray.200:alpha.20" }}
          _light={{ bg: "coolGray.100" }}
          width="100%"
          height="100%"
        >
          <Box mt={10}>
            <VStack space={5}>
              <Heading size="lg">Decentralized Recovery</Heading>
              <Box mt={50}>
                <Heading size="sm">What is decentralized recovery?</Heading>
                <Text>
                  Decentralized recovery was invented by Dr. Leemon Baird at
                  Swirlds Labs. It is a novel protocol for easy management of
                  your private cryptographic keys while avoiding the cumbersome
                  and error-prone responsibilities associated with it. The
                  protocol works by storing cryptographic shares of your private
                  keys with helpers of your choosing.
                </Text>
              </Box>
              <Box>
                <Heading size="sm">
                  How does decentralized recovery work?
                </Heading>
                <Text>
                  When you have a sufficient number of trusted helpers, this app
                  automatically encrypts your vault information and generates
                  cryptographic shares. The app then distributes these shares to
                  your chosen helpers, who store them securely. The app contacts
                  your helpers every night to ensure that the information is
                  kept up-to-date. No individual helper can misuse your
                  information as they only have access to a fragment of it.
                  Since helpers are unaware of each other's identity, collusion
                  to reconstruct your vault information is impossible. If you
                  lose your phone, you can retrieve shares from at least half of
                  your helpers to recover your vault. Once you retrieve enough
                  shares, the app automatically restores your vault and reveals
                  information about your other helpers.
                </Text>
              </Box>
              <Box>
                <Heading size="sm">Normal Operations</Heading>
                <Text>
                  To get started, go to the Helpers tab and pair with a minimum
                  of three trusted helpers. Ensure that these helpers do not
                  know each other's identity. After pairing, navigate to the
                  Vault tab to store your cryptographic keys. From there, the
                  app takes care of the rest by cryptographically encrypting
                  your information and distributing it to your helpers. That's
                  all it takes!
                </Text>
              </Box>
              <Box>
                <Heading size="sm">Recovery</Heading>
                <Text>
                  To recover your vault, simply remember the names of at least
                  half of your trusted helpers. After reinstalling the app on a
                  new device, reach out to your helpers as you did during the
                  initial pairing process. When you successfully link with half
                  of your original helpers, all your information will
                  automatically reappear on your new device. It's a
                  straightforward process!
                </Text>
              </Box>
            </VStack>
          </Box>
        </Box>
      </Center>
    </ScrollView>
  );
}
