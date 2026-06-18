import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // Memastikan CSS Tailwind v4 ter-load
import { AuthProvider } from "./context/AuthContext";
import axios from "axios";

// Interceptor untuk menangkap jika API mengembalikan error 401 (Unauthorized/Token Expired)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Hapus token palsu/expired dari storage
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // jika ada

      // Paksa browser redirect ke halaman login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
