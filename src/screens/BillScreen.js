import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { CartContext } from '../context/CartContext';
import { getItemById } from '../utility/getItemById';
// import * as Print from 'expo-print';
// import * as Sharing from 'expo-sharing';

export default function BillScreen() {
  const { cartItems } = useContext(CartContext);
  const [items, setItems] = useState([]);
  const [timestamp] = useState(new Date());

  useEffect(() => {
    const fetchDetails = async () => {
      const ids = Object.keys(cartItems);
      const results = await Promise.all(ids.map(getItemById));
      const merged = results.map((item, idx) => ({
        ...item,
        id: ids[idx],
        quantity: cartItems[ids[idx]]
      }));
      setItems(merged);
    };
    fetchDetails();
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

//   const generatePdf = async () => {
//     const html = `
//       <html>
//       <body style="font-family: Arial; padding: 20px;">
//         <h2>Smart Cart Bill</h2>
//         <p><b>Cart ID:</b> CART 1</p>
//         <p><b>Date:</b> ${timestamp.toLocaleDateString()}<br/>
//            <b>Time:</b> ${timestamp.toLocaleTimeString()}</p>
//         <table border="1" cellpadding="8" cellspacing="0" width="100%">
//           <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
//           <tbody>
//             ${items.map(item => `
//               <tr>
//                 <td>${item.name}</td>
//                 <td>${item.quantity}</td>
//                 <td>MYR ${(item.price * item.quantity).toFixed(2)}</td>
//               </tr>
//             `).join('')}
//           </tbody>
//         </table>
//         <p><b>Subtotal:</b> MYR ${subtotal.toFixed(2)}<br/>
//            <b>Tax (5%):</b> MYR ${tax.toFixed(2)}<br/>
//            <b>Total:</b> MYR ${total.toFixed(2)}</p>
//         <hr/>
//         <p>🛵 Delivery Mode: Follow/Manual</p>
//         <p>🔋 Battery: 85%</p>
//         <p style="text-align:center; margin-top: 20px;">THANK YOU FOR SHOPPING!</p>
//       </body>
//       </html>
//     `;

//     try {
//       const { uri } = await Print.printToFileAsync({ html });
//       await Sharing.shareAsync(uri);
//     } catch (err) {
//       Alert.alert('Error', 'Could not generate PDF');
//     }
//   };
const generatePdf = async () => {
  Alert.alert("Disabled", "PDF generation is currently turned off.");
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧾 BILL</Text>
      <ScrollView contentContainerStyle={styles.box}>
        <Text style={styles.cartLabel}>SMART CART</Text>
        <Text style={styles.meta}>🛒 Cart ID: CART 1</Text>
        <Text style={styles.meta}>📅 Date: {timestamp.toLocaleDateString()}</Text>
        <Text style={styles.meta}>⏰ Time: {timestamp.toLocaleTimeString()}</Text>
        <Text style={styles.meta}>✅ Status: Connected</Text>

        <View style={styles.listHeader}>
          <Text style={styles.th}>Item</Text>
          <Text style={styles.th}>Qty</Text>
          <Text style={styles.th}>Price</Text>
        </View>

        {items.map((item, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={styles.cell}>{item.name}</Text>
            <Text style={styles.cell}>{item.quantity}</Text>
            <Text style={styles.cell}>MYR {(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}

        <Text style={styles.meta}>Subtotal: MYR {subtotal.toFixed(2)}</Text>
        <Text style={styles.meta}>Tax (5%): MYR {tax.toFixed(2)}</Text>
        <Text style={styles.total}>Total: MYR {total.toFixed(2)}</Text>
        <Text style={styles.meta}>🚚 Delivery Mode: Follow/Manual</Text>
        <Text style={styles.meta}>🔋 Battery Status: 85%</Text>
        <Text style={styles.metaCenter}>THANK YOU FOR SHOPPING!</Text>
      </ScrollView>

      <TouchableOpacity style={styles.printBtn} onPress={generatePdf}>
        <Text style={styles.printText}>PRINT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 22, textAlign: 'center', marginTop: 20, marginBottom: 10, fontWeight: 'bold' },
  box: { backgroundColor: '#1e1e1e', margin: 16, borderRadius: 12, padding: 16 },
  cartLabel: { color: '#fff', fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  meta: { color: '#ccc', marginBottom: 4 },
  metaCenter: { color: '#ccc', marginTop: 10, textAlign: 'center' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderBottomWidth: 1, borderBottomColor: '#555', paddingBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  th: { color: '#ccc', fontWeight: 'bold', fontSize: 14 },
  cell: { color: '#eee', fontSize: 14 },
  total: { color: '#fff', fontSize: 16, marginTop: 8, fontWeight: 'bold' },
  printBtn: {
    backgroundColor: 'red',
    paddingVertical: 14,
    margin: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  printText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
