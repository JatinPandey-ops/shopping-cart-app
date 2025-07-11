import { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { CartContext } from '../context/CartContext';
import { getItemById } from '../utility/getItemById';
import { useNavigation } from '@react-navigation/native';

export default function CartScreen() {
  const {
    cartItems,
    incrementQty,
    decrementQty,
    removeFromCart,
  } = useContext(CartContext);

  const navigation = useNavigation();
  const [products, setProducts] = useState([]);

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

  const handleViewBill = () => {
    if (products.length === 0) {
      Alert.alert(
        'Cart is Empty',
        'Please add items to your cart before viewing the bill.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('Bill', { items: products, total });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>YOUR CART</Text>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Start adding items to see them here.</Text>
        </View>
      ) : (
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
                <TouchableOpacity onPress={() => incrementQty(item.id, item.inventory)}>
                  <Text style={styles.qtyBtn}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                <Text style={styles.delete}>❌</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <TouchableOpacity style={styles.billButton} onPress={handleViewBill}>
          <Text style={styles.billText}>View Bill - RM {total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fee7a2', // Mikado Yellow
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 22,
    color: '#000',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  list: {
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: '#FFC219',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#FFED9D',
  },
  info: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  price: {
    color: '#333',
    fontSize: 14,
    marginTop: 4,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD40C',
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  qtyBtn: {
    color: '#000',
    fontSize: 20,
    paddingHorizontal: 6,
  },
  qtyNum: {
    color: '#000',
    fontSize: 16,
    marginHorizontal: 4,
  },
  delete: {
    fontSize: 18,
    color: '#F50D01',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFC219',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  billButton: {
    backgroundColor: '#F50D01',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  billText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
