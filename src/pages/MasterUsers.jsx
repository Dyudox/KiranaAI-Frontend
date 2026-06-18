import React, { useState, useEffect } from "react";
import axios from "axios";
import Pagination from "../components/Pagination";
import { Pencil, Trash2, UserPlus, Loader2, Search } from "lucide-react";
import UserFormModal from "../components/modal/UserFormModal";
import { toast } from "sonner";
import PermissionGate from "../components/PermissionGate";
import { MENU } from "../constants/menuKeys";

const MasterUsers = () => {
  const [users, setUsers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Satukan semua parameter filter ke dalam satu state terpusat
  const [filters, setFilters] = useState({
    search: "",
    role_id: "",
    is_active: "",
  });

  // --- STATE PAGINATION (SERVER-SIDE) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // API Fetch Data Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/users`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: filters.search,
        },
      });
      setUsers(res.data.data || []);
      setTotalItems(res.data.total || 0);
    } catch (error) {
      console.error("Detail Error:", error);
      toast.error("Gagal memuat data");
    } finally {
      // 🌟 KUNCI: Pastikan baris ini ada di luar try dan catch!
      // Ini menjamin loading PASTI mati baik saat sukses maupun saat JSON-nya crash/error.
      setLoading(false);
    }
  };

  // Jalankan fetch otomatis saat filter, halaman aktif, atau jumlah data per halaman berubah
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, 400); // Debounce pencarian selama 400ms

    return () => clearTimeout(handler);
  }, [filters, currentPage, itemsPerPage]); // Tambahkan dependensi page agar ke-trigger saat pindah halaman

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        toast.success("User berhasil dihapus");
        fetchUsers();
      } catch (error) {
        toast.error("Gagal menghapus user");
      }
    }
  };

  return (
    <div className="p-6 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Master Data Users
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Kelola daftar pengguna aplikasi Anda
          </p>
        </div>
        <PermissionGate menuKey={MENU.USERS} action="can_create">
          <button
            onClick={() => {
              setSelectedUser(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <UserPlus size={18} /> Tambah User
          </button>
        </PermissionGate>
      </div>

      {/* 🔍 FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
          <input
            placeholder="Cari nama/username..."
            className="pl-10 p-2 w-full border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm"
            value={filters.search}
            onChange={(e) => {
              setCurrentPage(1); // Reset ke halaman 1 jika input pencarian berubah
              setFilters((prev) => ({ ...prev, search: e.target.value }));
            }}
          />
        </div>

        <select
          className="p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm"
          value={filters.role_id}
          onChange={(e) => {
            setCurrentPage(1);
            setFilters((prev) => ({ ...prev, role_id: e.target.value }));
          }}
        >
          <option value="">Semua Role</option>
          <option value="1">Admin</option>
          <option value="2">User</option>
        </select>

        <select
          className="p-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm"
          value={filters.is_active}
          onChange={(e) => {
            setCurrentPage(1);
            setFilters((prev) => ({ ...prev, is_active: e.target.value }));
          }}
        >
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>

      {/* Tabel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-zinc-500 flex justify-center items-center gap-2">
            <Loader2 className="animate-spin" size={20} /> Memuat data...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-transparent scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <tr className="text-sm text-zinc-700 dark:text-zinc-300">
                    <th className="p-4 font-semibold text-center w-16">No</th>
                    <th className="p-4 font-semibold">Nama</th>
                    <th className="p-4 font-semibold">Username</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                    <th className="p-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {users.map((user, index) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="p-4 text-sm text-center text-zinc-500 dark:text-zinc-400">
                        {/* Kalkulasi nomor urut kontinu antar halaman */}
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="p-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {user.name}
                      </td>
                      <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {user.username}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs text-zinc-700 dark:text-zinc-300">
                          {user.role_name}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${user.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" : "bg-red-100 text-red-700 dark:bg-red-900/30"}`}
                        >
                          {user.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="p-4 flex justify-center gap-3">
                        <PermissionGate
                          menuKey={MENU.USERS}
                          action="can_update"
                        >
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsModalOpen(true);
                            }}
                            className="text-zinc-400 hover:text-blue-600"
                          >
                            <Pencil size={17} />
                          </button>
                        </PermissionGate>
                        <PermissionGate
                          menuKey={MENU.USERS}
                          action="can_delete"
                        >
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-zinc-400 hover:text-red-600"
                          >
                            <Trash2 size={17} />
                          </button>
                        </PermissionGate>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            <Pagination
              data={users}
              totalItems={totalItems} // Mengirim 17 (data total utuh dari DB)
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
            />
          </>
        )}
      </div>

      {isModalOpen && (
        <UserFormModal
          user={selectedUser}
          onClose={() => setIsModalOpen(false)}
          onRefresh={fetchUsers}
        />
      )}
    </div>
  );
};

export default MasterUsers;
