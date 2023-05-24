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
 * Filename: ScanQRCodeWidget.tsx
 * Description: Frontend component for using the phone camera on PairingWidget.
 * Author: Dipti Mahamuni
 */

import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Button, useWindowDimensions, Platform } from "react-native";
import { Box, VStack, ZStack, HStack } from "native-base";
import { BarCodeScanner } from "expo-barcode-scanner";

// Ref:
// https://docs.expo.dev/versions/latest/sdk/bar-code-scanner/

export default function ScanQRCodeWidget(props) {
  const [hasPermission, setHasPermission] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();

    return function didUnmount() {
      setScanned(true);
    };
  }, []);

  useEffect(() => {
    setScanned(false);
  }, [props.cameraOn]);

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <Box style={styles.container}>
      {Platform.OS == "web" && <Text>QR code scanner only works on iOS or Android devices</Text>}
      {Platform.OS != "web" && scanned == false && <BarCodeScanner onBarCodeScanned={(obj) => props.callbacks.handleBarCodeScanned(obj)} style={StyleSheet.absoluteFillObject} />}
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    backgroundColor: "#fff",
  },
  barCodeView: {
    width: "100%",
    height: "50%",
    marginBottom: 40,
  },
});
