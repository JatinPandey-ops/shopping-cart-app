import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CartContext } from '../context/CartContext';
import { getItemById } from '../utility/getItemById';

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧾 SMART CART BILL</Text>
      <ScrollView contentContainerStyle={styles.receipt}>
        {/* Receipt Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Smart Cart</Text>
          <Text style={styles.headerSub}>Cart ID: CART 1</Text>
          <Text style={styles.headerSub}>Date: {timestamp.toLocaleDateString()}</Text>
          <Text style={styles.headerSub}>Time: {timestamp.toLocaleTimeString()}</Text>
        </View>

        {/* Item List */}
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.th, { flex: 3 }]}>Item</Text>
          <Text style={[styles.cell, styles.th, { flex: 1 }]}>Qty</Text>
          <Text style={[styles.cell, styles.th, { flex: 1 }]}>Price</Text>
        </View>

        {items.map((item, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={[styles.cell, { flex: 3 }]}>{item.name}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{item.quantity}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{(item.price * item.quantity).toFixed(2)} RM</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{subtotal.toFixed(2)} RM</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (5%)</Text>
            <Text style={styles.totalValue}>{tax.toFixed(2)} RM</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalLabelFinal}>Total</Text>
            <Text style={styles.totalValueFinal}>{total.toFixed(2)} RM</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Thank you for shopping with Smart Cart!</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fee7a2', 
  },
  title: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  receipt: {
    backgroundColor: '#fff9e8',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 12,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cell: {
    color: '#000',
    fontSize: 14,
  },
  th: {
    fontWeight: 'bold',
  },
  totals: {
    marginTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  totalLabel: {
    color: '#000',
    fontSize: 14,
  },
  totalValue: {
    color: '#000',
    fontSize: 14,
  },
  totalRowFinal: {
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabelFinal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValueFinal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F50D01', // Off Red for emphasis
  },
  footer: {
    textAlign: 'center',
    color: '#555',
    fontSize: 14,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
});
