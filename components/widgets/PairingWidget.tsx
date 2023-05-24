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
 * Filename: PairingWidget.tsx
 * Description: Frontend modal that is used for pairing. It generates the xor stream that is used in the
 * QR codes. It also displays the series of QR codes and contains a camera component (ScanQRCodeWidget) that is used to scan 
 * the QR codes using the phone camera. After a sufficient number of QR codes are scanned, the modal is closed.
 * When a pairing peer is in recovery mode, the RecoveryPairingConfirmationWidget is displayed.
 * Author: Dipti Mahamuni
 */

import React, { useState } from "react";
import { Box, VStack, Text, Modal, ZStack } from "native-base";
import { Animated, Dimensions, Platform, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import ScanQRCodeWidget from "./ScanQRCodeWidget";
import { Video, ResizeMode } from "expo-av";
import { Constants, OperatingModes } from "../../logic/Constants";
import { Helper } from "../../logic/Helper";
import { useDerecStore } from "../../utils/Store";
import { Base45 } from "../../logic/Base45";
import { RecoveryPairingConfirmationWidget } from "./RecoveryPairingConfirmationWidget";
import { User } from "../../logic/User";
import { generateXorStream } from "../../logic/utils";
import { PairingHandshakePacketData } from "../../logic/PairingSession";

type PacketType = {
  counter: number;
  data: Uint8Array;
};
// Ref:
// https://medium.com/geekculture/how-to-add-or-play-video-in-react-native-application-javascript-49ea952f1919
// https://docs.expo.dev/versions/latest/sdk/av/#setismutedasyncismuted

export function PairingWidget(props) {
  const { helpers } = useDerecStore();
  const [moveAnimation, setMoveAnimation] = useState(new Animated.Value(0));
  const [imageIndex, setImageIndex] = useState(0);
  const [qrCodeDimensions, setQrCodeDimensions] = useState({ x: 200, y: 200 });
  const [qrCodeImages, setQrCodeImages] = useState<Array<any>>([]);
  const [anim, setAnim] = useState<any>(null);
  const [pairingResponsePeerUser, setPairingResponsePeerUser] = useState<User>();
  const [b45, setB45] = useState(new Base45());
  const [showPairingWithRecoveringPeerConfirmationWidget, setShowPairingWithRecoveringPeerConfirmationWidget] = useState<boolean>(false);
  const [userConfirmedProceedWithRecovery, setUserConfirmedProceedWithRecovery] = useState<boolean>(false);
  const [packets, setPackets] = useState<Array<PacketType>>([]);
  // When we detect that remote peer is in recovery mode, distinguish between whether that was detected during pairing-request or in pairing-response processing
  const [pairingResponsePacketForRecoveringPeer, setPairingResponsePacketForRecoveringPeer] = useState<PairingHandshakePacketData | null>(null);

  React.useEffect(() => {
    // Start animation of QR codes
    _move();
  }, []);

  React.useEffect(() => {
    if (props.showModal == true) {
      anim?.start();
    } else {
      anim?.reset();
    }
    setUserConfirmedProceedWithRecovery(false);
    setShowPairingWithRecoveringPeerConfirmationWidget(false);
    setPackets([]);
    setPairingResponsePacketForRecoveringPeer(null);
  }, [props.showModal]);

  React.useEffect(() => {
    const newHelpers = helpers.filter((h: Helper) => h.user.name == Constants.unknownUserForPairing.name);
    if (newHelpers.length == 1) {
      const qImages: Array<any> = [];
      const newHelper = newHelpers[0];
      newHelper.callbacks = { ...newHelper.callbacks, pairingHandshakeResponseMatched: pairingHandshakeResponseMatched, confirmPairingWithRecoveringPeer: confirmPairingWithRecoveringPeer };

      const xorEncoded = xorEncode(newHelper.pairingSession.pairingRequestData);
      for (const pairingRequestData of xorEncoded) {
        const alphaNumericData = b45.toB45(new Uint8Array(pairingRequestData)).join("");
        const qrCode: any = <QRCode value={alphaNumericData} size={qrCodeDimensions.x} backgroundColor="transparent" color="black" />;
        qImages.push(qrCode);
      }
      setQrCodeImages(qImages);
    }
  }, [helpers.length]);

  function xorEncode(packets: Array<Uint8Array>): Array<Array<number>> {
    const ret: Array<Array<number>> = [];
    packets.forEach((packet) => {
      const counter = packet[0];

      const xorStream = generateXorStream(counter, packet.length - 1); // Remove the counter
      const xoredPacket = packet.map((d, index) => (index == 0 ? d : d ^ xorStream[index - 1]));

      ret.push(Array.from(xoredPacket));
    });

    return ret;
  }

  const handleBarCodeScanned = ({ type, data }) => {
    if (b45 == undefined) {
      return;
    }
    const b45Decoded = b45.fromB45(data.split(""));
    const counter: number = b45Decoded[0];
    global.log.pairing(`counter ${counter} scanned`);
    const isDuplicate: boolean = packets.filter((p: PacketType) => p.counter == counter).length > 0;
    if (!isDuplicate) {
      const xorStream = generateXorStream(counter, b45Decoded.length - 1); // Remove the counter
      const xoredPacket = b45Decoded.map((d, index) => (index == 0 ? d : d ^ xorStream[index - 1]));

      global.log.pairing(`xored packet: ${xoredPacket?.filter((x, index) => index < 10).join(" - ")}`);
      global.log.pairing(`peer recovery mode is: ${xoredPacket[2]}`);

      const peer = props.appLogic.getHelperByPhone(Constants.unknownUserForPairing.phone);
      if (!peer) {
        return;
      }
      const peerHandshakeData: PairingHandshakePacketData = peer.pairingSession.parsePairingHandshakePacket(xoredPacket);

      setPairingResponsePeerUser(new User(peerHandshakeData.name, peerHandshakeData.phone));

      if (peerHandshakeData.operatingMode == OperatingModes.Recovery && userConfirmedProceedWithRecovery == false) {
        setShowPairingWithRecoveringPeerConfirmationWidget(true);
      } else {
        packets.push({ counter: counter, data: xoredPacket });
        packets.sort((a: PacketType, b: PacketType) => a.counter - b.counter);
        for (let index = 0; index < packets.length - 2; index++) {
          if (packets[index].counter == packets[index + 1].counter - 1 && packets[index].counter == packets[index + 2].counter - 2) {
            global.log.pairing(`Three consecutive bar codes scanned starting from ${packets[index].counter}`);
            const packetsData = packets.filter((p: PacketType) => p.counter >= packets[index].counter && p.counter <= packets[index + 2].counter).map((e) => e.data);
            props.appLogic.handleNewHelperPairingRequest([packets[index].counter, packets[index + 1].counter, packets[index + 2].counter], packetsData);
            props.callbacks.pairingWidgetClosedCallback();
          }
        }
        setPackets(packets);
      }
    }
  };

  function pairingHandshakeResponseMatched() {
    props.callbacks.pairingWidgetClosedCallback();
  }

  // Backend calls this when it receives PairingResponse message and the peer is trying to recover
  // We need to ask the user to confirm if they are ok to proceed with helping the peer with recovery before we can continue
  function confirmPairingWithRecoveringPeer(pairingResponsePacket: PairingHandshakePacketData) {
    global.log.recovery(`in confirmPairingWithRecoveringPeer, peer:`, pairingResponsePacket);
    setPairingResponsePeerUser(new User(pairingResponsePacket.name, pairingResponsePacket.phone));
    setPairingResponsePacketForRecoveringPeer(pairingResponsePacket);
    setShowPairingWithRecoveringPeerConfirmationWidget(true);
  }

  // This function is called when the user accepts or denies pairing with a recovering peer
  function proceedWithRecovery(proceedWithRecoveryFlag: boolean) {
    global.log.recovery(`in proceedWithRecovery(${proceedWithRecoveryFlag}), pairingResponsePacketForRecoveringPeer:`, pairingResponsePacketForRecoveringPeer);
    if (proceedWithRecoveryFlag == true) {
      if (pairingResponsePacketForRecoveringPeer == null) {
        setUserConfirmedProceedWithRecovery(true);
      } else {
        const peer = props.appLogic.getHelperByPhone(Constants.unknownUserForPairing.phone);
        props.appLogic.handleHelperPairingResponseBody(peer, pairingResponsePacketForRecoveringPeer);
        setPairingResponsePacketForRecoveringPeer(null);
      }
    } else {
      setPairingResponsePacketForRecoveringPeer(null);
      props.callbacks.pairingWidgetClosedCallback();
    }
  }

  const _move = () => {
    var lastImageIndex = 0;
    const listener = moveAnimation.addListener(({ value }) => {
      const newIndex = Math.round(value) % Constants.PairingNumCounters;

      if (newIndex != lastImageIndex) {
        setImageIndex(newIndex);
        lastImageIndex = newIndex;
      }
    });

    const a = Animated.loop(
      Animated.timing(moveAnimation, {
        toValue: 5 * Constants.PairingNumCounters,
        duration: 5000 * 1,

        useNativeDriver: Platform.OS == "web" ? false : true,
      }),
      { iterations: -1 }
    );

    setAnim(a);
  };

  return (
    <Modal isOpen={props.showModal} avoidKeyboard size="lg" useNativeDriver={true}>
      <Modal.Content width="100%">
        <Modal.CloseButton onPress={() => props.callbacks.pairingWidgetClosedCallback()} />
        <Modal.Header> Add a Helper </Modal.Header>
        <Modal.Body>
          {showPairingWithRecoveringPeerConfirmationWidget == true && userConfirmedProceedWithRecovery == false && (
            <Box>
              <RecoveryPairingConfirmationWidget showAlert={true} peerUser={pairingResponsePeerUser} callbacks={{ proceedWithRecovery: (proceedWithRecoveryFlag) => proceedWithRecovery(proceedWithRecoveryFlag) }} />
            </Box>
          )}
          <Box>
            <Text style={{ alignSelf: "center", padding: 20 }}>Please either scan the pattern on your helper's phone, or have them scan the pattern on your phone to intiate pairing.</Text>
            <VStack>
              <ZStack style={{ alignItems: "center", alignSelf: "center", width: qrCodeDimensions.x, height: qrCodeDimensions.y }}>
                <Box style={{ width: qrCodeDimensions.x, height: qrCodeDimensions.y }}>
                  {true && (
                    <Video
                      source={require("../../assets/QRBackgroundVideo.mov")}
                      resizeMode={ResizeMode.CONTAIN}
                      isLooping
                      shouldPlay={true}
                      style={{
                        alignSelf: "center",
                        width: qrCodeDimensions.x,
                        height: qrCodeDimensions.y,
                      }}
                    />
                  )}
                </Box>

                <Box style={{ opacity: 1.0 }}>{qrCodeImages[imageIndex]}</Box>
              </ZStack>

              <Box style={{ height: 30 }}></Box>

              <Box style={{ alignItems: "center", alignSelf: "center" }}>
                {props.showModal && <ScanQRCodeWidget cameraOn={props.showModal ? true : false} callbacks={{ ...props.callbacks, handleBarCodeScanned: handleBarCodeScanned }} appLogic={props.appLogic} />}
              </Box>
            </VStack>
          </Box>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}
