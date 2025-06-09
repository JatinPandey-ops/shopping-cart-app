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
import { getItemByName } from '../utility/getItemByName';

const { width } = Dimensions.get('window');

export default function SearchItemScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      return false;
    });

    return () => {
      mountedRef.current = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      backHandler.remove();
    };
  }, []);

  const handleSearch = async (text) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    if (controllerRef.current) controllerRef.current.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    const items = await getItemByName(text, controller.signal);
    if (!controller.signal.aborted && mountedRef.current) {
      setResults(items);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>🔎 Find Items in Store</Text>

          <TextInput
            placeholder="Search item name..."
            placeholderTextColor="#aaa"
            style={styles.input}
            value={query}
            onChangeText={handleSearch}
          />

          {loading && <ActivityIndicator color="#00C897" size="large" style={{ marginBottom: 20 }} />}

          {!loading && results.length === 0 && query.length >= 2 && (
            <Text style={styles.empty}>No matching items found.</Text>
          )}

          {!loading && results.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.card}>
              <Image
                source={{ uri: item.image }}
                style={styles.image}
                onError={() => console.warn('⚠️ image load error')}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardLocation}>📍 {item.location}</Text>
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
  container: { flexGrow: 1, backgroundColor: '#121212', padding: 20, paddingTop: 60 },
  heading: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  input: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  image: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: 12,
    backgroundColor: '#333',
    marginRight: 16,
  },
  cardInfo: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardLocation: { color: '#ccc', fontSize: 14, marginBottom: 4 },
  cardPrice: { color: '#00C897', fontSize: 16, fontWeight: '600' },
  empty: { color: '#888', textAlign: 'center', marginTop: 30, fontSize: 16 },
});
