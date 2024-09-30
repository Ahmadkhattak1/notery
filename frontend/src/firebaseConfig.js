// frontend/src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCalTfAk-0lOvT10ja728Hy_D8bkqHiBQs",
    authDomain: "notery-7db57.firebaseapp.com",
    projectId: "notery-7db57",
    storageBucket: "notery-7db57.appspot.com",
    messagingSenderId: "38533750395",
    appId: "1:38533750395:web:5a2c7fdca45511fc518cde"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
