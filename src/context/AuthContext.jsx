// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // Pastikan impor sesuai
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [isLoading] = useState(true);

  // 🔄 Fungsi untuk memperbarui permissions secara real-time tanpa relogin
  const refreshPermissions = async () => {
    const token = localStorage.getItem("token"); // Ambil token
    try {
      const response = await axios.get(
        "http://localhost:5000/api/auth/my-permissions",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // LOG INI SANGAT PENTING:
      console.log("Struktur response penuh:", response);
      console.log("Isi response.data:", response.data);

      // Kita asumsikan backend mungkin langsung mengembalikan array atau objek
      // Sesuaikan ini dengan struktur data yang muncul di log "Isi response.data" nanti
      const newPermissions = response.data.permissions || response.data || [];

      setUserPermissions(newPermissions);

      // Update LocalStorage
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      savedUser.permissions = newPermissions;
      localStorage.setItem("user", JSON.stringify(savedUser));

      return true;
    } catch (error) {
      console.error(
        "Gagal saat refreshPermissions:",
        error.response?.data || error.message,
      );
      return false;
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);

      // 1. Simpan ke state agar komponen lain (Sidebar) bisa baca
      setUserPermissions(userData.permissions || []);

      // 2. Jika Anda menyimpan data user profile, pasang di sini (opsional)
      if (userData.user) {
        setUser(userData.user);
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userPermissions,
        setUserPermissions,
        refreshPermissions, // <--- Kita daftarkan di provider agar bisa dipakai di halaman lain
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
