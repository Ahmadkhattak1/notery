import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Import getStorage

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCalTfAk-0lOvT10ja728Hy_D8bkqHiBQs",
    authDomain: "notery-7db57.firebaseapp.com",
    projectId: "notery-7db57",
    storageBucket: "notery-7db57.appspot.com",
    messagingSenderId: "38533750395",
    appId: "1:38533750395:web:5a2c7fdca45511fc518cde"
  };

  const app = initializeApp(firebaseConfig);

  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app); // Initialize storage
  
  export { auth, db, storage }; // Export storage
  
