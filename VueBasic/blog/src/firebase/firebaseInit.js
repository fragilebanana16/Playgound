import firebase from "firebase/app";
import "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD29hHECaffNQI4jdSbd3jaWkes6LARgCk",
    authDomain: "vueblog-88d91.firebaseapp.com",
    projectId: "vueblog-88d91",
    storageBucket: "vueblog-88d91.appspot.com",
    messagingSenderId: "353334449597",
    appId: "1:353334449597:web:c79e6a9eb6be50ac192ed4"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const timestamp = firebase.firestore.FieldValue.serverTimestamp;

export { timestamp };
export default firebaseApp.firestore();