import firebase from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDNA-9m5KvjcxAeTE6ixr_bhXr2Hs2zNys",
  authDomain: "spherical-easel.firebaseapp.com",
  projectId: "spherical-easel",
  storageBucket: "spherical-easel.appspot.com",
  messagingSenderId: "157369820516",
  appId: "1:157369820516:web:70391e3fea4b7d6ef7c671"
};

firebase.initializeApp(firebaseConfig);
// export const firebaseAuth = firebase.auth();
export const firebaseFirestore = getFirestore()
// export const firebaseStorage = firebase.storage();