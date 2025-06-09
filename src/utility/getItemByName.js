import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

export const getItemByName = async (text) => {
  try {
    const ref = collection(db, 'items');
    const q = query(ref, where('name', '>=', text), where('name', '<=', text + '\uf8ff'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
     if (signal?.aborted) return []; // cancel quietly
    console.error('Firestore error:', err);
    return [];
  }
};
