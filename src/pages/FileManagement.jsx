import React, { useState, useEffect, useRef } from "react";
import Pagination from "../components/Pagination";
import {
  RefreshCw,
  Upload,
  Cpu,
  File,
  HardDrive,
  FileText,
  Layers,
  Search,
  Trash2,
  Eye,
} from "lucide-react";

export default function FileManagement() {
  // === DATA & UI STATE ===
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({
    total_file: 0,
    total_size: 0,
    total_pdf: 0,
    total_excel: 0,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState([]);

  // === FILTER STATE ===
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAccess, setFilterAccess] = useState("");

  const fileInputRef = useRef(null);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- LOGIKA PEMOTONGAN DATA (SLICING) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Data terpotong inilah yang sekarang di-render di dalam <tbody>
  const currentTableData = files.slice(indexOfFirstItem, indexOfLastItem);

  // Cek apakah seluruh baris di halaman aktif saat ini sudah dicentang semua
  const isAllCurrentPageSelected =
    currentTableData.length > 0 &&
    currentTableData.every((file) =>
      selectedFileIds.includes(file.id || file.file_id),
    );

  // ==========================================
  // 1. FETCH DATA & STATISTIK FROM BACKEND
  // ==========================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        file_type: filterType,
        access_type: filterAccess,
      }).toString();

      const response = await fetch(
        `http://localhost:5000/api/files?${queryParams}`,
      );
      const data = await response.json();

      if (data.success && data.files) {
        setFiles(data.files);
        if (data.statistics) setStats(data.statistics);
      } else if (Array.isArray(data)) {
        setFiles(data);
      } else if (data.data && Array.isArray(data.data)) {
        setFiles(data.data);
      }

      // Reset ke halaman 1 jika user melakukan pencarian atau ganti filter baru
      // agar tidak terjebak di halaman kosong jika data berkurang
    } catch (error) {
      console.error("Gagal mengambil data file:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset halaman ke 1 setiap kali query filter berubah
    fetchData();
  }, [search, filterType, filterAccess]);

  const formatBytes = (bytes) => {
    const num = parseInt(bytes);
    if (!num || isNaN(num) || num === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // ==========================================
  // 2. PROSES UPLOAD FILE
  // ==========================================
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file terlalu besar! Maksimal adalah 10MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await fetch("http://localhost:5000/api/files/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.message || "Gagal mengunggah file");
      }
    } catch (error) {
      console.error("Error saat upload:", error);
      alert("Terjadi kesalahan sistem saat mengunggah berkas");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // --- HANDLER CHECKBOX (DIPERBAIKI UNTUK HALAMAN AKTIF) ---
  const handleSelectAll = () => {
    const currentIds = currentTableData.map((file) => file.id || file.file_id);

    if (isAllCurrentPageSelected) {
      // Hapus centang hanya untuk item yang ada di halaman aktif saat ini
      setSelectedFileIds(
        selectedFileIds.filter((id) => !currentIds.includes(id)),
      );
    } else {
      // Gabungkan centang lama dengan item-item baru di halaman aktif ini
      const newSelections = [...selectedFileIds, ...currentIds];
      setSelectedFileIds([...new Set(newSelections)]); // Set memastikan tidak ada id ganda
    }
  };

  const handleSelectFile = (id) => {
    if (selectedFileIds.includes(id)) {
      setSelectedFileIds(selectedFileIds.filter((item) => item !== id));
    } else {
      setSelectedFileIds([...selectedFileIds, id]);
    }
  };

  const handleLoadToKB = async () => {
    if (selectedFileIds.length === 0) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/files/load-to-kb",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_ids: selectedFileIds }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Berhasil memuat berkas ke Knowledge Base!");
        setSelectedFileIds([]);
        fetchData();
      } else {
        alert(data.message || "Gagal memproses injeksi berkas ke KB.");
      }
    } catch (error) {
      console.error("Gagal memuat ke KB:", error);
      alert("Terjadi kesalahan jaringan saat mencoba menghubungi server.");
    }
  };

  // ==========================================
  // 4. AKSI LIHAT / DOWNLOAD FILE
  // ==========================================
  const handleDownload = (id) => {
    window.location.href = `http://localhost:5000/api/files/download/${id}`;
  };

  // ==========================================
  // 5. AKSI HAPUS FILE
  // ==========================================
  const handleDelete = async (id, filename) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus '${filename}'?\nSemua data chunk & embedding berkas ini akan ikut terhapus permanen.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/files/delete/${id}`,
        {
          method: "DELETE",
        },
      );
      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.message || "Gagal menghapus berkas");
      }
    } catch (error) {
      console.error("Error delete:", error);
      alert("Gagal mengeksekusi perintah hapus");
    }
  };

  return (
    <div className="p-6 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* HEADER SECTION */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">File Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Pusat kendali berkas dokumen & injeksi Knowledge Base Kirana AI
        </p>
      </div>

      {/* 1. KELOMPOK STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl shadow-sm bg-white border rounded-lg dark:bg-zinc-800 dark:border-zinc-700/70">
          <div className="flex items-center justify-between ">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Total File
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-200">
                {stats.total_file || stats.totalFiles || 0}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <File size={22} />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl shadow-sm bg-white border rounded-lg dark:bg-zinc-800 dark:border-zinc-700/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Total Size
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-200">
                {formatBytes(stats.total_size || stats.totalSize)}
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
              <HardDrive size={22} />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl shadow-sm bg-white border rounded-lg dark:bg-zinc-800 dark:border-zinc-700/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Total PDF
              </p>
              <h3 className="text-2xl font-bold mt-1 text-rose-500 dark:text-rose-400">
                {stats.total_pdf || stats.totalPdf || 0}
              </h3>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-lg">
              <FileText size={22} />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl shadow-sm bg-white border rounded-lg dark:bg-zinc-800 dark:border-zinc-700/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Total Excel
              </p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-500 dark:text-emerald-400">
                {stats.total_excel || stats.totalExcel || 0}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Layers size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. KELOMPOK FILTER & INPUT KONTROL */}
      <div className="p-4 rounded-xl border mb-6 flex flex-wrap gap-4 items-center justify-between bg-white border rounded-lg dark:bg-zinc-800 dark:border-zinc-700/70">
        <div className="flex flex-wrap gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Cari nama file..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
          >
            <option value="">Semua Tipe</option>
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel (.xlsx)</option>
          </select>

          <select
            value={filterAccess}
            onChange={(e) => setFilterAccess(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
          >
            <option value="">Semua Akses</option>
            <option value="RW">Read & Write (RW)</option>
            <option value="R">Read-Only (R)</option>
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.xls,.xlsx"
          />

          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-orange-600 dark:hover:bg-orang-700 transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={triggerUploadClick}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm transition disabled:opacity-50"
          >
            <Upload size={16} /> {uploading ? "Uploading..." : "Upload File"}
          </button>

          <button
            onClick={handleLoadToKB}
            disabled={selectedFileIds.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedFileIds.length > 0
                ? "bg-amber-500 text-slate-950 hover:bg-amber-600 font-semibold shadow-md"
                : "bg-slate-500/10 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800/60 cursor-not-allowed"
            }`}
          >
            <Cpu size={16} /> Load ke KB ({selectedFileIds.length})
          </button>
        </div>
      </div>

      {/* 3. STRUKTUR TABEL DATA */}
      <div className="border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800/80">
        <div className="overflow-x-auto bg-transparent scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse text-sm bg-white dark:bg-zinc-900">
            <thead>
              <tr className="border-b font-semibold bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                <th className="p-4 w-12 text-center border-b border-zinc-200/60 dark:border-zinc-700/60">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={handleSelectAll}
                    className="appearance-none rounded border border-zinc-300 dark:border-zinc-600 bg-transparent dark:bg-transparent checked:bg-orange-600 checked:dark:bg-orange-600 checked:border-transparent checked:dark:border-transparent cursor-pointer w-4 h-4 text-white relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[2px] after:w-[4px] after:h-[8px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45"
                  />
                </th>
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4">File Name</th>
                <th className="p-4 w-24">Type</th>
                <th className="p-4 w-28">Size</th>
                <th className="p-4 w-36">Date Create</th>
                <th className="p-4 w-36">Date Change</th>
                <th className="p-4 w-24 text-center">Access</th>
                <th className="p-4 w-32 text-center">Status KB</th>
                <th className="p-4 w-28 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td
                    colSpan="10"
                    className="p-8 text-center text-slate-400 dark:text-slate-500"
                  >
                    Memuat data berkas...
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="p-8 text-center text-slate-400 dark:text-slate-500"
                  >
                    Tidak ada berkas yang ditemukan.
                  </td>
                </tr>
              ) : (
                currentTableData.map((file, index) => {
                  const currentId = file.id || file.file_id;
                  const filename =
                    file.filename ||
                    file.file_name ||
                    file.name ||
                    "Unknown File";
                  const fileType =
                    file.file_type || file.fileType || file.type || "-";
                  const fileSize =
                    file.file_size || file.fileSize || file.size || 0;
                  const createdAt =
                    file.created_at || file.createdAt || file.date_created;
                  const updatedAt =
                    file.updated_at || file.updatedAt || file.date_changed;
                  const accessType =
                    file.access_type || file.accessType || "RW";
                  const isKbLoaded =
                    file.is_kb_loaded || file.isKbLoaded || false;

                  return (
                    <tr
                      key={currentId || index}
                      className={`transition ${
                        selectedFileIds.includes(currentId)
                          ? "bg-blue-50/40 dark:bg-blue-950/10"
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/20"
                      }`}
                    >
                      <td className="p-4 text-center border-gray-100 dark:border-gray-700/50">
                        <input
                          type="checkbox"
                          checked={selectedFileIds.includes(currentId)}
                          onChange={() => handleSelectFile(currentId)}
                          className="appearance-none rounded border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-transparent checked:bg-orange-600 checked:dark:bg-orange-600 checked:border-transparent checked:dark:border-transparent cursor-pointer w-4 h-4 text-white relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[2px] after:w-[4px] after:h-[8px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45"
                        />
                      </td>
                      <td className="p-4 text-center text-slate-400 dark:text-slate-500">
                        {/* Berkelanjutan lintas halaman (Halaman 2 mulai dari No 11 jika limit 10) */}
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td
                        className="p-4 font-medium text-slate-700 dark:text-slate-200 max-w-xs truncate"
                        title={filename}
                      >
                        {filename}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold tracking-wide uppercase ${
                            fileType.toLowerCase() === "pdf"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {fileType}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {formatBytes(fileSize)}
                      </td>
                      <td className="p-4 text-xs text-slate-400 dark:text-slate-500">
                        {createdAt
                          ? new Date(createdAt).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                      <td className="p-4 text-xs text-slate-400 dark:text-slate-500">
                        {updatedAt
                          ? new Date(updatedAt).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/10">
                          {accessType}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isKbLoaded
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400"
                          }`}
                        >
                          {isKbLoaded ? "Loaded" : "Ready"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleDownload(currentId)}
                            className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500"
                            title="Lihat"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(currentId, filename)}
                            className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* PEMANGGILAN COMPONENT PAGINATION */}
          <Pagination
            data={files}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
          />
        </div>
      </div>
    </div>
  );
}
