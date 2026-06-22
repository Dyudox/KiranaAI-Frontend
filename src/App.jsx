import React, { useState, useEffect } from "react";
import { Toaster } from "sonner";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Loader2, Settings } from "lucide-react"; // Untuk spinner loading yang rapi
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import KnowledgeBase from "./pages/KnowledgeBase";
import MasterUsers from "./pages/MasterUsers";
import MasterRoles from "./pages/MasterRoles";
import FileManagement from "./pages/FileManagement";
import Recording from "./pages/RecordingManagement";
import SuggestedQuestions from "./pages/SuggestedQuestions";
import SettingsPage from "./pages/Settings";
// import Settings from "./pages/Settings";

// Komponen Sementara untuk Mengetes Menu Knowledge Base AI
const DummyDocuments = () => (
  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm font-sans">
    <h2 className="text-base font-bold text-stone-900 mb-2">
      Pustaka Dokumen / Korpus Data
    </h2>
    <p className="text-sm text-stone-600">
      Tempat mengunggah file PDF, DOCX, atau Markdown untuk dilatih ke dalam
      model AI.
    </p>
  </div>
);

const DummyKategori = () => (
  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm font-sans">
    <h2 className="text-base font-bold text-stone-900 mb-2">
      Kategori Pengetahuan
    </h2>
    <p className="text-sm text-stone-600">
      Mengelola taksonomi artikel menggunakan fungsi backend:{" "}
      <code className="bg-stone-100 px-1 py-0.5 rounded text-orange-600 font-mono">
        kategori
      </code>
      .
    </p>
  </div>
);

const DummyChatPlayground = () => (
  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm font-sans">
    <h2 className="text-base font-bold text-stone-900 mb-2">
      AI Playground (Kirana AI)
    </h2>
    <p className="text-sm text-stone-600">
      Konsol uji coba untuk melakukan *Prompting* dan menguji akurasi jawaban AI
      berdasarkan data internal perusahaan.
    </p>
  </div>
);

axios.defaults.baseURL = "http://localhost:5000";

// 1. Setup global axios - REQUEST INTERCEPTOR (Token Injection)
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 2. Setup global axios - RESPONSE INTERCEPTOR (Catch 401 & Auto Clear Storage)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Sesi berakhir (401 Unauthorized). Membersihkan storage...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000; // Ubah milidetik ke hitungan detik

          // Jika waktu sekarang sudah melewati waktu kedalwarsa token (8 jam)
          if (decoded.exp < currentTime) {
            console.log("Sesi 8 jam telah habis. Menghapus storage...");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        } catch (error) {
          // Jika token corrupt/gagal didecode, bersihkan storage demi keamanan
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }

      // Selesai mengecek token, matikan layar loading screen awal
      setIsInitializing(false);
    };

    checkTokenExpiration();
  }, []);

  // Tampilkan layar loading sejenak saat user menekan F5/Refresh halaman
  if (isInitializing) {
    return (
      <div className="min-h-screen h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-orange-500 mb-2" size={36} />
        <p className="text-sm text-slate-500 font-sans animate-pulse">
          Memvalidasi sesi login...
        </p>
      </div>
    );
  }

  return (
    <Router>
      <Toaster richColors position="top-right" expand={false} />
      <Routes>
        {/* 🔓 Jalur Terbuka */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* 🔒 Jalur Terproteksi Berbasis Nested Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Semua sub-rute di bawah ini akan otomatis merender dirinya di bagian <Outlet /> pada MainLayout */}
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route
            path="/kb-history"
            element={
              <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-white">
                <h2>KB History Log</h2>
              </div>
            }
          />
          <Route path="/kb-data" element={<DummyKategori />} />
          <Route path="/file-management" element={<FileManagement />} />
          <Route path="/recording" element={<Recording />} />

          {/* Kelompok Master Data */}
          <Route path="/master/users" element={<MasterUsers />} />
          <Route path="/master/roles" element={<MasterRoles />} />
          <Route
            path="/master/suggested-questions"
            element={<SuggestedQuestions />}
          />

          <Route path="/setting" element={<SettingsPage />} />
        </Route>

        {/* 🚨 Jalur Pengaman jika rute tidak ditemukan */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
