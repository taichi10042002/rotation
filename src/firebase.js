import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCRLr6YOeLqHWUdCOB2GzM8Z2XChVrPLsw",
    authDomain: "niwari-e5d6d.firebaseapp.com",
    projectId: "niwari-e5d6d",
    storageBucket: "niwari-e5d6d.firebasestorage.app",
    messagingSenderId: "495203663666",
    appId: "1:495203663666:web:f0597cbfdb3fb78aaba12b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ログイン状態をローカルに永続保存（PWA・ホーム画面追加対応）
setPersistence(auth, browserLocalPersistence);