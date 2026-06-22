import React, { useState, useEffect } from "react";
import axios from "axios";
import Pagination from "../components/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Search,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Edit3, // 🌟 Tambah ikon Edit
  Calendar,
  User,
  HelpCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function SuggestedQuestions() {
  // === STATE DATA & UI ===
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // === STATE FILTER & SEARCHING ===
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // --- STATE PAGINATION (SERVER-SIDE) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // === STATE MODAL & FORM (UNTUK ADD & EDIT) ===
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // 🌟 State penanda mode Edit
  const [currentId, setCurrentId] = useState(null); // 🌟 Menyimpan ID yang sedang diedit
  const [formData, setFormData] = useState({ name: "", question: "" });
  const [submitLoading, setSubmitLoading] = useState(false);

  // === FETCH DATA FROM BACKEND ===
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/suggested-questions",
        {
          params: {
            page: currentPage,
            limit: itemsPerPage,
            search,
            status: filterStatus,
          },
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const hasilResponse = res.data.data || [];
      const totalDataDariServer = res.data.pagination?.totalRows || 0;

      setQuestions(hasilResponse);
      setTotalItems(totalDataDariServer);
    } catch (error) {
      console.error("Gagal memuat data suggested questions:", error);
      toast.error("Gagal memuat daftar rekomendasi pertanyaan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchQuestions();
    }, 500);
    return () => clearTimeout(handler);
  }, [currentPage, itemsPerPage, search, filterStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  const handleClearFilter = () => {
    setSearch("");
    setFilterStatus("");
    setCurrentPage(1);
  };

  // 🌟 FUNGSIONALITAS MEMBUKA MODAL EDIT
  const handleEditClick = (item) => {
    setIsEditMode(true);
    setCurrentId(item.id);
    setFormData({
      name: item.name || "",
      question: item.question || item.value || "", // Menyesuaikan jika dari API mengembalikan .value
      is_active: String(item.is_active), // 🎯 Konversi boolean dari server ke string "true"/"false"
    });
    setIsOpenModal(true);
  };

  // 🌟 FUNGSI CLOSE MODAL (RESET FORM)
  const handleCloseModal = () => {
    setIsOpenModal(false);
    setIsEditMode(false);
    setCurrentId(null);
    setFormData({ name: "", question: "" });
  };

  // === ACTIONS HANDLER (SUBMIT ADD / EDIT) ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem("token");

      if (isEditMode) {
        // 🎯 JIKA MODE EDIT: Hit ke endpoint PUT / PATCH update
        const res = await axios.put(
          `http://localhost:5000/api/suggested-questions/${currentId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (res.data.success) {
          toast.success("Pertanyaan berhasil diperbarui");
          handleCloseModal();
          fetchQuestions(); // Refresh halaman saat ini
        }
      } else {
        // 🎯 JIKA MODE TAMBAH BARU
        const res = await axios.post(
          "http://localhost:5000/api/suggested-questions",
          formData,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (res.data.success) {
          toast.success("Pertanyaan berhasil ditambahkan");
          handleCloseModal();
          setCurrentPage(1);
          fetchQuestions();
        }
      }
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      toast.error(error.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `http://localhost:5000/api/suggested-questions/${id}/status`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data.success) {
        toast.success("Status berhasil diperbarui");
        fetchQuestions();
      }
    } catch (error) {
      console.error("Gagal mengubah status:", error);
      toast.error("Gagal mengubah status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pertanyaan ini?")) {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.delete(
          `http://localhost:5000/api/suggested-questions/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.data.success) {
          toast.success("Pertanyaan terhapus");
          if (questions.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          } else {
            fetchQuestions();
          }
        }
      } catch (error) {
        console.error("Gagal menghapus data:", error);
        toast.error("Gagal menghapus data");
      }
    }
  };

  return (
    <div className="p-6 min-h-screen bg-transparent text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* HEADER SECTION */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Suggested Questions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pengelolaan rekomendasi obrolan AI untuk membantu interaksi pengguna
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchQuestions}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => {
              setIsEditMode(false);
              setIsOpenModal(true);
            }}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-sm transition duration-150 flex items-center gap-2 cursor-pointer text-sm"
          >
            <Plus size={16} />
            Tambah Pertanyaan
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 rounded-xl bg-white dark:bg-zinc-800 border border-stone-200 dark:border-slate-800/80 shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau pertanyaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-950 text-slate-800 dark:text-slate-200"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full md:w-48 px-3 py-2 rounded-lg border text-sm outline-none bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-950 text-slate-700 dark:text-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>

        {(search || filterStatus) && (
          <button
            onClick={handleClearFilter}
            className="w-full md:w-auto px-4 py-2 rounded-lg border text-sm font-medium outline-none transition bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-950 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <X size={15} />
            Clear
          </button>
        )}
      </div>

      {/* STRUKTUR TABEL */}
      <div className="border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-800 border border-stone-200 dark:border-slate-800/80">
        <div className="overflow-x-auto bg-transparent">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b font-semibold bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4 w-44">Nama / Kategori</th>
                <th className="p-4 min-w-[250px]">Pertanyaan</th>
                <th className="p-4 w-32 text-center">Status</th>
                <th className="p-4 w-40">Tanggal Buat</th>
                <th className="p-4 w-28 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 dark:bg-zinc-900">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-8 text-center text-slate-400 dark:text-slate-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2
                        className="animate-spin text-orange-500"
                        size={18}
                      />
                      <span>Memuat data pertanyaan...</span>
                    </div>
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-8 text-center text-slate-400 dark:text-slate-500"
                  >
                    Tidak ada data suggested questions ditemukan.
                  </td>
                </tr>
              ) : (
                questions.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <td className="p-4 text-center text-slate-400 dark:text-slate-500 font-medium">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="p-4 font-medium text-slate-900 dark:text-zinc-100 truncate max-w-[150px]">
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">
                          {item.name || "System"}
                        </span>
                      </div>
                    </td>
                    <td
                      className="p-4 max-w-sm text-slate-600 dark:text-slate-300 truncate"
                      title={item.question}
                    >
                      <div className="flex items-center gap-1.5">
                        <HelpCircle
                          size={14}
                          className="text-slate-400 shrink-0"
                        />
                        <span className="truncate">{item.question}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() =>
                          handleToggleStatus(item.id, item.is_active)
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border cursor-pointer transition ${
                          item.is_active
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                        }`}
                      >
                        {item.is_active ? "● Aktif" : "○ Non-Aktif"}
                      </button>
                    </td>
                    <td className="p-4 text-xs text-slate-400 dark:text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString(
                                "id-ID",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                },
                              )
                            : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* 🌟 TOMBOL EDIT BARU */}
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-orange-500 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Edit Pertanyaan"
                        >
                          <Edit3 size={15} />
                        </button>

                        {/* TOMBOL HAPUS */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-red-500 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Hapus Pertanyaan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* COMPONENT PAGINATION */}
        <Pagination
          data={questions}
          totalItems={totalItems}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
        />
      </div>

      {/* MODAL OVERLAY: ADD & EDIT QUESTION */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-800 w-full max-w-md rounded-xl p-6 shadow-xl border border-stone-200 dark:border-slate-700">
            {/* 🌟 Judul Modal Dinamis */}
            <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">
              {isEditMode
                ? "Edit Suggested Question"
                : "Tambah Suggested Question"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Nama Pembuat / Kategori
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Admin atau Telemarketing"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Teks Pertanyaan
                </label>
                <textarea
                  required
                  rows="3"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="Ketikkan rekomendasi pertanyaan..."
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Status Pertanyaan
                </label>
                <Select
                  value={formData.is_active}
                  onValueChange={(val) =>
                    setFormData({ ...formData, is_active: val })
                  }
                >
                  <SelectTrigger className="w-full h-10 bg-background border border-slate-200 dark:border-slate-950 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-orange-500 bg-slate-50 dark:bg-slate-950 outline-none transition-all cursor-pointer">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>

                  <SelectContent className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                    <SelectItem
                      value="true"
                      className="text-xs font-medium cursor-pointer focus:bg-orange-100 dark:focus:bg-orange-800 focus:text-orange-900 dark:focus:text-orange-100"
                    >
                      🟢 Aktif
                    </SelectItem>
                    <SelectItem
                      value="false"
                      className="text-xs font-medium cursor-pointer focus:bg-orange-100 dark:focus:bg-orange-800 focus:text-orange-900 dark:focus:text-orange-100"
                    >
                      🔴 Tidak Aktif
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {submitLoading && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {isEditMode ? "Simpan Perubahan" : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
