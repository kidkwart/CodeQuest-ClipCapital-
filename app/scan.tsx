import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Lucide from "lucide-react-native";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from "@/context/theme-context";

const { width } = Dimensions.get('window');

export default function ScanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const parsedData = JSON.parse(data);
      if (parsedData.type === 'payment' && parsedData.userId) {
        router.replace({
          pathname: "/send-money",
          params: {
            recipientId: parsedData.userId,
            name: parsedData.name,
            business: parsedData.business
          }
        });
      } else {
        alert("Invalid QR Code");
        setScanned(false);
      }
    } catch (e) {
      // If it's not JSON, it might just be a raw User ID
      if (data.length > 20) { // Simple check for UUID-like string
          router.replace({
            pathname: "/send-money",
            params: { recipientId: data }
          });
      } else {
        alert("Could not read QR Code");
        setScanned(false);
      }
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 20 }}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={{ padding: 16, backgroundColor: colors.primary, borderRadius: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <Stack.Screen options={{
        headerShown: true, title: "Scan QR", headerTransparent: true,
        headerTintColor: '#fff',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Lucide.ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
        )
      }} />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}></View>
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.focusedContainer}>
             <View style={[styles.corner, styles.topLeft]} />
             <View style={[styles.corner, styles.topRight]} />
             <View style={[styles.corner, styles.bottomLeft]} />
             <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
        <View style={styles.unfocusedContainer}>
            <Text style={styles.hintText}>Position the QR code within the frame</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtn: { height: 44, width: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', marginLeft: 20 },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  middleContainer: {
    flexDirection: 'row',
    height: width * 0.7,
  },
  focusedContainer: {
    width: width * 0.7,
    height: width * 0.7,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#10b981',
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
  hintText: { color: '#fff', fontSize: 14, marginTop: 20, fontWeight: '600' }
});
