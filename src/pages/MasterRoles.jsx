import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Pencil, Trash2, UserPlus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import RoleFormModal from "../components/modal/RoleFormModal";
import PermissionGate from "../components/PermissionGate";
import { MENU } from "../constants/menuKeys";
import { AuthContext } from "../context/AuthContext";
// Import shared component kustom kita
import Pagination from "../components/Pagination";

const MasterRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [search, setSearch] = useState("");
  const { refreshPermissions } = useContext(AuthContext);

  // --- SINKRONISASI STATE PAGINATION KUSTOM ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default langsung 3 baris

  // --- LOGIKA PEMOTONGAN DATA (CLIENT-SIDE SLICING) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Data terpotong inilah yang akan di-loop di dalam <tbody>
  const currentTableData = Array.isArray(roles)
    ? roles.slice(indexOfFirstItem, indexOfLastItem)
    : [];

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus role ini?")) {
      try {
        await axios.delete(`http://localhost:5000/api/roles/${id}`);
        await refreshPermissions();
        toast.success("Role berhasil dihapus!");
        fetchRoles();
      } catch (error) {
        console.error("Gagal menghapus role:", error);
        toast.error(error.response?.data?.message || "Gagal menghapus role");
      }
    }
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Ambil seluruh data role agar fitur filter pencarian global dan slice client tetap bekerja sinkron
      const res = await axios.get(`http://localhost:5000/api/roles`, {
        // 🌟 Pindahkan filter ke dalam objek params bersih di sini
        params: {
          search: search, // Sesuaikan dengan nama state search Anda
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Sesuai standarisasi response API Anda
      setRoles(res.data.data || res.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error(
        "Gagal memuat roles: " +
          (error.response?.data?.message || "Terjadi kesalahan"),
      );
    } finally {
      setLoading(false);
    }
  };

  // Jalankan fetch ulang jika filter pencarian berubah
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRoles();
    }, 500); // Debounce pencarian agar hemat request

    return () => clearTimeout(handler);
  }, [search]);

  return (
    <div className="p-6 min-h-screen transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Master Roles
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Atur tingkat hak akses user aplikasi Kirana AI
          </p>
        </div>
        <PermissionGate menuKey={MENU.ROLES} action="can_create">
          <button
            onClick={() => {
              setSelectedRole(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <UserPlus size={18} /> Tambah Role
          </button>
        </PermissionGate>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
        <input
          placeholder="Cari role..."
          value={search}
          onChange={(e) => {
            setCurrentPage(1); // Reset halaman ke 1 saat mengetik kata kunci baru
            setSearch(e.target.value);
          }}
          className="pl-10 p-2 w-full md:w-64 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-sm outline-none focus:border-orange-500 transition-all"
        />
      </div>

      {/* Tabel dengan Modifikasi Pembungkus Scroll HP Adaptif */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-zinc-500 flex justify-center items-center gap-2">
            <Loader2 className="animate-spin" size={20} /> Memuat data...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-transparent scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <tr className="text-zinc-700 dark:text-zinc-300">
                    <th className="p-4 w-16 text-center font-semibold">No.</th>
                    <th className="p-4 font-semibold">Nama Role</th>
                    <th className="p-4 font-semibold">Deskripsi</th>
                    <th className="p-4 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {currentTableData.map((role, index) => (
                    <tr
                      key={role.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors text-zinc-900 dark:text-zinc-100"
                    >
                      <td className="p-4 text-center text-zinc-500 dark:text-zinc-400">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="p-4 font-medium">{role.name}</td>
                      <td className="p-4 text-zinc-600 dark:text-zinc-400">
                        {role.description}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <PermissionGate
                            menuKey={MENU.ROLES}
                            action="can_update"
                          >
                            <button
                              onClick={() => {
                                setSelectedRole(role);
                                setIsModalOpen(true);
                              }}
                              className="text-zinc-400 hover:text-blue-600 transition-colors"
                            >
                              <Pencil size={17} />
                            </button>
                          </PermissionGate>
                          <PermissionGate
                            menuKey={MENU.ROLES}
                            action="can_delete"
                          >
                            <button
                              onClick={() => handleDelete(role.id)}
                              className="text-zinc-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={17} />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* INTEGRASI FOOTER COMPONENT KUSTOM */}
            <Pagination
              data={roles}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
            />
          </>
        )}
      </div>

      {isModalOpen && (
        <RoleFormModal
          role={selectedRole}
          onClose={() => setIsModalOpen(false)}
          onRefresh={async () => {
            await refreshPermissions();
            fetchRoles();
          }}
        />
      )}
    </div>
  );
};

export default MasterRoles;
