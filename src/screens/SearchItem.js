import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const { width } = Dimensions.get('window');

export default function SearchItemScreen() {
  const [query, setQuery] = useState('');
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAllItems = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'items'));
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (mountedRef.current) {
          setAllItems(items);
          setFilteredItems(items);
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Failed to fetch items:', err.message);
        setLoading(false);
      }
    };

    fetchAllItems();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => false);

    return () => {
      mountedRef.current = false;
      backHandler.remove();
    };
  }, []);

  const handleSearch = (text) => {
    setQuery(text);
    if (text.trim().length === 0) {
      setFilteredItems(allItems);
    } else {
      const filtered = allItems.filter(item =>
        item.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>🔎 All Store Items</Text>

          <TextInput
            placeholder="Search item name..."
            placeholderTextColor="#aaa"
            style={styles.input}
            value={query}
            onChangeText={handleSearch}
          />

          {loading && <ActivityIndicator color="#F50D01" size="large" style={{ marginTop: 30 }} />}

          {!loading && filteredItems.length === 0 && (
            <Text style={styles.empty}>No matching items found.</Text>
          )}

          {!loading && filteredItems.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.card}>
              <Image
                source={{ uri: item.image }}
                style={styles.image}
                onError={() => console.warn('⚠️ image load error')}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardLocation}>📍 {item.location}</Text>
                <Text style={styles.cardInventory}>📦 Stock: {item.inventory || 0}</Text>
                <Text style={styles.cardPrice}>RM {item.price.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fee7a2', // Mikado Yellow background
    padding: 20,
    paddingTop: 60,
  },
  heading: {
    color: '#000',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFC219',
    borderRadius: 10,
    padding: 14,
    color: '#000',
    fontSize: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFC219',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  image: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: 12,
    backgroundColor: '#FFED9D',
    marginRight: 16,
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardLocation: {
    color: '#333',
    fontSize: 14,
    marginBottom: 4,
  },
  cardInventory: {
    color: '#555',
    fontSize: 14,
    marginBottom: 4,
  },
  cardPrice: {
    color: '#F50D01',
    fontWeight: '600',
  },
  empty: {
    color: '#F50D01',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    fontWeight: '600',
  },
});
