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
 * Filename: RecoveryPairingConfirmationWidget.tsx
 * Description: Frontend modal that is displayed when the PairingWidget detects that the party a user is trying to pair with 
 * is in recovery mode to allow the user to confirm whether they want to continue pairing with that party.
 * Author: Dipti Mahamuni
 */

import React, { useState } from "react";
import { AlertDialog, Text, Center, Heading, Button, Box } from "native-base";
import { formatPhoneNumber } from "../../logic/utils";

export function RecoveryPairingConfirmationWidget(props) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (props.showAlert == true) {
      setIsOpen(true);
    }
  }, [props.showAlert]);

  const onClose = () => setIsOpen(false);

  function registerDecision(proceedWithRecovery: boolean) {
    global.log.recovery(`in registerDecision ${proceedWithRecovery}`);
    setIsOpen(false);
    props.callbacks.proceedWithRecovery(proceedWithRecovery);
  }

  const cancelRef = React.useRef(null);
  return (
    <Center>
      <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <Heading size="sm">
              {props.peerUser?.name} ({props.peerUser ? formatPhoneNumber(props.peerUser?.phone) : ""}) is trying to recover
            </Heading>
            <Text></Text>
          </AlertDialog.Header>
          <AlertDialog.Body>You should allow this only if you trust {props.peer?.name} and have verified in person that they are indeed trying to recover their vault and are acting under their free will.</AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button variant="unstyled" colorScheme="coolGray" onPress={() => registerDecision(false)} ref={cancelRef}>
                Deny
              </Button>
              <Button colorScheme="danger" onPress={() => registerDecision(true)}>
                Proceed with recovery
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Center>
  );
}
