import { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { CartContext } from '../context/CartContext';
import { getItemById } from '../utility/getItemById';
import { useNavigation } from '@react-navigation/native';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import uuid from 'react-native-uuid';

export default function CartScreen() {
  const {
    cartItems,
    incrementQty,
    decrementQty,
    removeFromCart,
  } = useContext(CartContext);

  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [cartId, setCartId] = useState(null);

  useEffect(() => {
    const newId = uuid.v4(); // generate unique cart ID
    setCartId(newId);
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      const ids = Object.keys(cartItems);
      const results = await Promise.all(ids.map(getItemById));
      const merged = results
        .map((item, index) => item && {
          ...item,
          id: ids[index],
          quantity: cartItems[ids[index]] || 1
        })
        .filter(Boolean);

      setProducts(merged);
    };
    fetchItems();
  }, [cartItems]);

  const total = products.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleGenerateBill = async () => {
    try {
      const cartRef = doc(db, 'carts', cartId);

      await setDoc(cartRef, {
        cartId,
        status: 'active',
        createdAt: Timestamp.now(),
        items: products.map(item => ({
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }))
      });

      console.log('Cart saved with ID:', cartId);
      navigation.navigate('Bill', { cartId });
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🛒 YOUR CART</Text>
      {cartId && <Text style={styles.cartId}>Cart ID: {cartId}</Text>}

      <ScrollView contentContainerStyle={styles.list}>
        {products.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>RM {item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.qtyControls}>
              <TouchableOpacity onPress={() => decrementQty(item.id)}>
                <Text style={styles.qtyBtn}>–</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => incrementQty(item.id)}>
                <Text style={styles.qtyBtn}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item.id)}>
              <Text style={styles.delete}>❌</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <TouchableOpacity style={styles.billButton} onPress={handleGenerateBill}>
          <Text style={styles.billText}>Generate Bill - RM {total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 16, paddingTop: 30 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 6 },
  cartId: { color: '#ccc', fontSize: 14, textAlign: 'center', marginBottom: 10 },
  list: { paddingBottom: 100 },
  itemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  image: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#333' },
  info: { flex: 1, marginLeft: 10 },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  price: { color: '#ccc', fontSize: 14, marginTop: 4 },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  qtyBtn: { color: '#fff', fontSize: 20, paddingHorizontal: 6 },
  qtyNum: { color: '#fff', fontSize: 16, marginHorizontal: 4 },
  delete: { fontSize: 18, color: '#ff4d4d' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  billButton: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  billText: { color: '#fff', fontWeight: 'bold' },
});
