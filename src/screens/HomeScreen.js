import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView, RefreshControl } from 'react-native';
import * as Location from 'expo-location';
import { BleManager } from 'react-native-ble-plx';
import { decode as atob } from 'base-64';
import { useNavigation } from '@react-navigation/native';
import { CartContext } from '../context/CartContext';
import { Buffer } from 'buffer';

const manager = new BleManager();

export default function HomeScreen() {
  const [locationGranted, setLocationGranted] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedCart, setConnectedCart] = useState(null);
  const [cartCharacteristic, setCartCharacteristic] = useState(null);
  const [coords, setCoords] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const monitorRef = useRef(null);

  const navigation = useNavigation();
  const { addToCart, clearCart } = useContext(CartContext);

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
    const loc = await Location.getCurrentPositionAsync({});
    setCoords(loc.coords);
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

  const onRefresh = async () => {
    setRefreshing(true);
    scanForDevices();
    setTimeout(() => setRefreshing(false), 1500);
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

      clearCart();
      setConnectedCart(discoveredDevice);
      setCartCharacteristic(char);

      await char.monitor((error, characteristic) => {
        if (error) {
          console.log("❌ Notify error:", error.message);
          return;
        }

        const raw = characteristic?.value;
        const decoded = atob(raw);
        console.log("📡 Received Product ID:", decoded);
        addToCart(decoded);
      });

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

  const handleDisconnect = async () => {
    if (connectedCart) {
      try {
        await connectedCart.cancelConnection();
      } catch (err) {
        console.log("⚠️ Disconnect error:", err.message);
      }
    }

    if (monitorRef.current) {
      monitorRef.current.remove();
    }

    setConnectedCart(null);
    setCartCharacteristic(null);
    scanForDevices();
  };

  const sendCommand = async (cmd) => {
    if (!connectedCart || !cartCharacteristic) {
      Alert.alert('Not Connected', 'Cannot send command. No cart is connected.');
      return;
    }

    try {
      const encoded = Buffer.from(cmd).toString('base64');
      await connectedCart.writeCharacteristicWithResponseForService(
        cartCharacteristic.serviceUUID,
        cartCharacteristic.uuid,
        encoded
      );
      console.log(`📤 Sent Command: ${cmd}`);
    } catch (err) {
      console.log(`❌ Send error: ${err.message}`);
      Alert.alert('Error', `Failed to send "${cmd}" command.`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🔗 Connect to Smart Cart</Text>

      {connectedCart ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          <Text style={styles.connectedText}>CART 1</Text>
          <Text style={styles.status}>CONNECTED</Text>

          <View style={styles.mapBox}>
            <Text style={styles.mapText}>🗺️ Map Preview</Text>
          </View>

          <Text style={styles.coords}>Latitude: {coords?.latitude?.toFixed(4) || '--'}° N</Text>
          <Text style={styles.coords}>Longitude: {coords?.longitude?.toFixed(4) || '--'}° E</Text>

          <TouchableOpacity style={[styles.navBtn, { backgroundColor: 'green' }]} onPress={() => sendCommand('START')}>
            <Text style={styles.navBtnText}>START CART</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navBtn, { backgroundColor: 'red' }]} onPress={() => sendCommand('STOP')}>
            <Text style={styles.navBtnText}>STOP CART</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => {
              if (connectedCart && cartCharacteristic) {
                navigation.navigate('CartControl', {
                  connectedDevice: connectedCart,
                  characteristic: cartCharacteristic,
                });
              } else {
                Alert.alert('Not ready', 'BLE connection not fully established.');
              }
            }}
          >
            <Text style={styles.navBtnText}>MANUAL CART CONTROL</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.navBtnText}>VIEW CART CONTENT</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('SearchItem')}>
            <Text style={styles.navBtnText}>SEARCH ITEM</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
            <Text style={styles.buttonText}>DISCONNECT</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={<Text style={styles.subtext}>Searching for available carts...</Text>}
          contentContainerStyle={{ paddingBottom: 30 }}
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.deviceItem} onPress={() => handleConnect(item)}>
              <Text style={styles.deviceText}>{item.name || 'Unnamed Device'}</Text>
              <Text style={styles.deviceId}>{item.id}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.subtext}>No devices found. Pull to refresh.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20, paddingTop: 60 },
  heading: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subtext: { color: '#aaa', fontSize: 16, marginBottom: 10, textAlign: 'center' },
  deviceItem: { backgroundColor: '#1e1e1e', padding: 16, borderRadius: 10, marginBottom: 12 },
  deviceText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deviceId: { color: '#888', fontSize: 12, marginTop: 4 },
  connectedText: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  status: { color: '#00C897', textAlign: 'center', fontWeight: '600', marginBottom: 12 },
  mapBox: {
    backgroundColor: '#1e1e1e',
    height: 160,
    marginBottom: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: { color: '#aaa', fontSize: 16 },
  coords: { color: '#ccc', textAlign: 'center', marginBottom: 6 },
  navBtn: { backgroundColor: '#1e1e1e', paddingVertical: 14, marginBottom: 12, borderRadius: 10 },
  navBtnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  disconnectBtn: { backgroundColor: '#ff4d4d', paddingVertical: 14, marginTop: 16, borderRadius: 10 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
});
