const productionConfig = {
  apiKey: "AIzaSyCY78mz7KKVT7SYZSLFpND8GSbVCoUrjL4",
  authDomain: "scoreflow-6059f.firebaseapp.com",
  projectId: "scoreflow-6059f",
  storageBucket: "scoreflow-6059f.firebasestorage.app",
  messagingSenderId: "631811112806",
  appId: "1:631811112806:web:cb43ba18dabe5a919452a7"
};

// A demo project cannot fall through to real Firebase services during tests.
export const firebaseConfig = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true"
  ? { apiKey: "demo-key", authDomain: "demo-scoreflow.firebaseapp.com", projectId: "demo-scoreflow", storageBucket: "demo-scoreflow.appspot.com", appId: "demo-scoreflow" }
  : productionConfig;
