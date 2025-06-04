// src/screens/HomeScreen.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import * as Location from 'expo-location';
import { BleManager } from 'react-native-ble-plx';
import { decode as atob } from 'base-64';

const manager = new BleManager();

export default function HomeScreen() {
  const [locationGranted, setLocationGranted] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedCart, setConnectedCart] = useState(null);
  const [cartDataText, setCartDataText] = useState('');
  const monitorRef = useRef(null);

  useEffect(() => {
    requestPermissions();
    return () => manager.destroy();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for Bluetooth scanning.');
      return;
    }
    setLocationGranted(true);
    scanForDevices();
  };

  const scanForDevices = () => {
    console.log('📡 Scanning started...');
    setDevices([]);
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('❌ Scan error:', error);
        return;
      }

      if (device?.name) {
        setDevices((prev) => {
          const exists = prev.find((d) => d.id === device.id);
          return exists ? prev : [...prev, device];
        });
      }
    });
  };

  const handleConnect = async (device) => {
    try {
      manager.stopDeviceScan();
      const connectedDevice = await device.connect();
      const discoveredDevice = await connectedDevice.discoverAllServicesAndCharacteristics();

      const services = await manager.servicesForDevice(discoveredDevice.id);
      const fff0 = services.find(s => s.uuid.toLowerCase().includes('fff0'));
      if (!fff0) throw new Error("Service fff0 not found");

      const characteristics = await manager.characteristicsForDevice(discoveredDevice.id, fff0.uuid);
      const char = characteristics.find(c => c.uuid.toLowerCase().includes('fff1'));
      if (!char) throw new Error("Characteristic fff1 not found");

      await char.monitor((error, characteristic) => {
        if (error) {
          console.log("❌ Notify error:", error.message);
          return;
        }
        const raw = characteristic?.value;
        const decoded = atob(raw);
        console.log("📡 New cart data (notified):", decoded);
        setCartDataText(decoded);
      });

      setConnectedCart(discoveredDevice);

      monitorRef.current = manager.onDeviceDisconnected(discoveredDevice.id, (err, dev) => {
        if (!err) {
          console.log("🔌 Cart disconnected:", dev?.name);
          Alert.alert("Cart disconnected", `${dev?.name || 'Device'} is no longer available.`);
        }
        handleDisconnect();
      });
    } catch (err) {
      console.log("❌ BLE Connection Error:", err.message);
      Alert.alert("Connection Failed", err.message);
    }
  };

  const handleDisconnect = () => {
    setConnectedCart(null);
    setCartDataText('');
    if (monitorRef.current) {
      monitorRef.current.remove();
    }
    scanForDevices();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Cart Connection Hub</Text>

      {connectedCart ? (
        <>
          <Text style={styles.connectedText}>✅ Connected to: {connectedCart.name}</Text>
          <View style={styles.dataBox}>
            <Text style={styles.dataText}>📝 Cart Data:</Text>
            {cartDataText
              .split(/[,{}"]+/)
              .filter(Boolean)
              .map((line, idx) => (
                <Text key={idx} style={styles.dataTextSmall}>{line.trim()}</Text>
              ))}
          </View>
          <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtext}>🔍 Scanning for nearby devices...</Text>
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.deviceItem} onPress={() => handleConnect(item)}>
                <Text style={styles.deviceText}>{item.name || 'Unnamed Device'}</Text>
                <Text style={styles.deviceId}>{item.id}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.subtext}>No devices found yet...</Text>}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 60,
  },
  heading: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtext: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  deviceItem: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  deviceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceId: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  connectedText: {
    color: '#4C5FD5',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
  dataBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  dataText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  dataTextSmall: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 4,
  },
  disconnectBtn: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
