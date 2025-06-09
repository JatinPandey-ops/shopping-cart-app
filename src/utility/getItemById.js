import { doc, getDoc } from 'firebase/firestore';
import { Alert } from 'react-native';
import { db } from '../../firebase';

export const getItemById = async (itemId) => {
  try {
    const ref = doc(db, 'items', itemId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      Alert.alert('Item Not Found', `Item with ID "${itemId}" does not exist.`);
      return null;
    }

    const data = snap.data();

    // Optional: validate fields
    if (!data.name || !data.price) {
      Alert.alert('Invalid Item', `Item "${itemId}" is missing required fields.`);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ Firestore query error:', err.message);
    Alert.alert('Error', 'Failed to fetch item. Please try again.');
    return null;
  }
};
