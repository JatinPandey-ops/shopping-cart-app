import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Buffer } from 'buffer';
import { Ionicons } from '@expo/vector-icons';

export default function CartControlScreen({ route }) {
  const { connectedDevice, characteristic } = route.params;

  const sendCommand = async (cmd) => {
    try {
      const base64Cmd = Buffer.from(cmd).toString('base64');
      await connectedDevice.writeCharacteristicWithResponseForService(
        characteristic.serviceUUID,
        characteristic.uuid,
        base64Cmd
      );
      console.log(`\ud83d\udce4 Sent: ${cmd}`);
    } catch (err) {
      console.log('\u274c Send Error:', err.message);
      Alert.alert('Error', 'Failed to send command.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>CART 1</Text>
      <Text style={styles.status}>CONNECTED</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.arrow} onPress={() => sendCommand('UP')}>
          <Ionicons name="arrow-up" size={36} color="white" />
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity style={styles.arrow} onPress={() => sendCommand('LEFT')}>
            <Ionicons name="arrow-back" size={36} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.stopBtn} onPress={() => sendCommand('STOP')}>
            <Text style={styles.stopText}>STOP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.arrow} onPress={() => sendCommand('RIGHT')}>
            <Ionicons name="arrow-forward" size={36} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.arrow} onPress={() => sendCommand('DOWN')}>
          <Ionicons name="arrow-down" size={36} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
 container: {
  flex: 1,
  backgroundColor: '#000',
  alignItems: 'center',
  justifyContent: 'center', // ✅ vertically center
},

  heading: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  status: { color: 'lime', marginBottom: 40 },
  grid: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  arrow: {
    backgroundColor: '#1e1e1e',
    padding: 24,
    borderRadius: 16,
    marginHorizontal: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  stopBtn: {
    backgroundColor: 'red',
    paddingVertical: 24,
    paddingHorizontal: 30,
    borderRadius: 50,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  stopText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
