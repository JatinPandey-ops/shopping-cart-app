import { doc, getDoc } from 'firebase/firestore';
import { Alert } from 'react-native';
import { db } from '../../firebase';

export const getItemById = async (itemId) => {
  try {
    const ref = doc(db, 'items', itemId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      Alert.alert('Item Not Found', 'This item is not recognized in our system.');
      return null;
    }

    const data = snap.data();

    //validate fields
    if (!data.name || !data.price) {
      Alert.alert('Invalid Item', `Item "${itemId}" is missing required fields.`);
      return null;
    }

    //Check inventory level
    if (data.inventory === 0) {
      Alert.alert('Out of Stock', `Sorry, "${data.name}" is currently out of stock.`);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ Firestore query error:', err.message);
    Alert.alert('Error', 'Failed to fetch item. Please try again.');
    return null;
  }
};
