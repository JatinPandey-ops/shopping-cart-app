import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView, RefreshControl, Image } from 'react-native';
import * as Location from 'expo-location';
import { BleManager } from 'react-native-ble-plx';
import { decode as atob } from 'base-64';
import { useNavigation } from '@react-navigation/native';
import { CartContext } from '../context/CartContext';
import { Buffer } from 'buffer';
import { getItemById } from '../utility/getItemById';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const manager = new BleManager();

export default function HomeScreen() {
  const [locationGranted, setLocationGranted] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [connectedCart, setConnectedCart] = useState(null);
  const [cartCharacteristic, setCartCharacteristic] = useState(null);
  const [coords, setCoords] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mapUrl, setMapUrl] = useState('');
  const monitorRef = useRef(null);
  const gpsWatcherRef = useRef(null);

  const navigation = useNavigation();
  const { addToCart, clearCart } = useContext(CartContext);

  useEffect(() => {
    requestPermissions();
    fetchMapUrl();
    return () => {
      manager.destroy();
      stopGpsSync();
    };
  }, []);

  const fetchMapUrl = async () => {
    try {
      // console.log("running mapurl")
      const ref = doc(db, 'storemap', 'main');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setMapUrl(snap.data().url);
      }
    } catch (err) {
      console.error('❌ Failed to fetch map URL:', err);
    }
  };
// console.log(mapUrl)
  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionError('❌ Location permission denied. Please enable it to use Smart Cart.');
        return;
      }
      setLocationGranted(true);
      setPermissionError(null);
      gpsWatcherRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 2 },
        (loc) => setCoords(loc.coords)
      );
      scanForDevices();
    } catch (err) {
      setPermissionError(`❌ Error getting permission: ${err.message}`);
    }
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
        setDevices((prev) => (prev.find((d) => d.id === device.id) ? prev : [...prev, device]));
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
      if (!fff0) throw new Error('Service fff0 not found');
      const characteristics = await manager.characteristicsForDevice(discoveredDevice.id, fff0.uuid);
      const charRX = characteristics.find(c => c.uuid.toLowerCase().includes('fff1'));
      if (!charRX) throw new Error('Characteristic fff1 not found');
      const char = characteristics.find(c => c.uuid.toLowerCase().includes('fff2'));
      if (!char) throw new Error('Characteristic fff2 not found');

      clearCart();
      setConnectedCart(discoveredDevice);
      setCartCharacteristic(charRX);
      startGpsSync(connectedDevice, charRX);

      await char.monitor((error, characteristic) => {
        if (error) {
          console.log('❌ Notify error:', error.message);
          return;
        }
        (async () => {
          try {
            const raw = characteristic?.value;
            const decoded = atob(raw);
            if (decoded.startsWith('RFID:')) {
              const uuid = decoded.replace(/^RFID:/, '');
              console.log('📡 Received RFID UUID:', uuid);
              const item = await getItemById(uuid);
              if (!item) {
                console.log('⚠️ Unknown item ignored:', uuid);
                return;
              }
              addToCart(uuid, item.inventory);
            }
          } catch (err) {
            console.error('⚠️ Error processing RFID:', err);
          }
        })();
      });

      monitorRef.current = manager.onDeviceDisconnected(discoveredDevice.id, (err, dev) => {
        if (!err) {
          console.log('🔌 Cart disconnected:', dev?.name);
          Alert.alert('Cart disconnected', `${dev?.name || 'Device'} is no longer available.`);
        }
        handleDisconnect();
      });
    } catch (err) {
      console.log('❌ BLE Connection Error:', err.message);
      Alert.alert('Connection Failed', err.message);
    }
  };

  const handleDisconnect = async () => {
    if (connectedCart) {
      try {
        await connectedCart.cancelConnection();
      } catch (err) {
        console.log('⚠️ Disconnect error:', err.message);
      }
    }
    if (monitorRef.current) {
      monitorRef.current.remove();
    }
    stopGpsSync();
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

 const startGpsSync = async (device, charRX) => {
    gpsWatcherRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 0.2,
      },
      async (loc) => {
        setCoords(loc.coords);

        const payload = `${loc.coords.latitude.toFixed(6)},${loc.coords.longitude.toFixed(6)}`;
        const encoded = Buffer.from(payload).toString('base64');

        try {
          await device.writeCharacteristicWithResponseForService(
            charRX.serviceUUID,
            charRX.uuid,
            encoded
          );
          console.log("📤 GPS sent:", payload);
          console.log(`📍 Sending precise GPS: ${loc.coords.latitude.toFixed(6)},${loc.coords.longitude.toFixed(6)}`);

        } catch (err) {
          console.log("❌ GPS send error:", err.message);
        }
      }
    );
  };

  const stopGpsSync = () => {
    if (gpsWatcherRef.current) {
      gpsWatcherRef.current.remove();
      gpsWatcherRef.current = null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🔗 Connect to Smart Cart</Text>
      {connectedCart ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }} 
         refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await fetchMapUrl();
        setRefreshing(false);
      }}
    />
  }
        >
          <Text style={styles.connectedText}>CART 1</Text>
          <Text style={styles.status}>CONNECTED</Text>
          <View style={styles.mapBox}>
            {mapUrl ? (
              <Image source={{ uri: mapUrl }} style={styles.mapImage} resizeMode="cover" />
            ) : (
              <Text style={styles.mapText}>🗺️ Map Preview Unavailable</Text>
            )}
          </View>
          {permissionError ? (
            <Text style={styles.permissionError}>{permissionError}</Text>
          ) : (
            <>
              <Text style={styles.coords}>Latitude: {coords?.latitude?.toFixed(6) || '--'}° N</Text>
              <Text style={styles.coords}>Longitude: {coords?.longitude?.toFixed(6) || '--'}° E</Text>
            </>
          )}
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: 'green' }]} onPress={() => sendCommand('START')}>
            <Text style={styles.navBtnText}>START CART</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, { backgroundColor: 'red' }]} onPress={() => sendCommand('STOP')}>
            <Text style={styles.navBtnText}>STOP CART</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtnManual} onPress={() => {
            if (connectedCart && cartCharacteristic) {
              navigation.navigate('CartControl', {
                connectedDevice: connectedCart,
                characteristic: cartCharacteristic,
              });
            } else {
              Alert.alert('Not ready', 'BLE connection not fully established.');
            }
          }}>
            <Text style={styles.navBtnText}>MANUAL CART CONTROL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('SearchItem')}>
            <Text style={styles.navBtnText}>SEARCH ITEM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.navBtnText}>VIEW CART CONTENT</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#fee7a2',
    padding: 20,
    paddingTop: 60,
  },
  heading: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtext: {
    color: '#333',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionError: {
    color: '#F50D01',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  deviceItem: {
    backgroundColor: '#FFC219',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  deviceText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceId: {
    color: '#333',
    fontSize: 12,
    marginTop: 4,
  },
  connectedText: {
    color: '#000',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  status: {
    color: '#00C897',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  mapBox: {
    backgroundColor: '#FFC219',
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    objectFit:"contain"
  },
  mapText: {
    color: '#000',
    fontSize: 16,
  },
  coords: {
    color: '#000',
    textAlign: 'center',
    marginBottom: 6,
  },
  navBtn: {
    backgroundColor: '#e4b015',
    paddingVertical: 14,
    marginBottom: 12,
    borderRadius: 10,
  },
  navBtnManual: {
    backgroundColor: 'blue',
    paddingVertical: 14,
    marginBottom: 12,
    borderRadius: 10,
  },
  navBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disconnectBtn: {
    backgroundColor: 'red',
    paddingVertical: 14,
    marginTop: 16,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
