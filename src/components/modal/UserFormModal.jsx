import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const UserFormModal = ({ user, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    password: "", // Password kosong saat edit
    role_id: user?.role_id || "",
    is_active: user?.is_active ?? true,
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/roles");
        setRoles(res.data.data);
        // console.log("Isi dari roles:", res.data.data);
      } catch (error) {
        console.error("Gagal mengambil data roles:", error);
      }
    };
    fetchRoles();
  }, []);

  // 2. Definisikan fungsi handleChange
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Tentukan apakah kita POST (Tambah) atau PUT (Edit)
    const isEditing = !!user; // true jika user ada, false jika null

    const url = isEditing
      ? `http://localhost:5000/api/users/${user.id}`
      : `http://localhost:5000/api/users`;

    const savePromise = isEditing
      ? axios.put(url, formData)
      : axios.post(url, formData);

    toast.promise(savePromise, {
      loading: isEditing ? "Memperbarui data..." : "Menambahkan user...",
      success: () => {
        onRefresh();
        onClose();
        return isEditing
          ? "Data berhasil diperbarui!"
          : "User berhasil ditambahkan!";
      },
      error: (err) => {
        return (
          err.response?.data?.message || "Terjadi kesalahan saat menyimpan data"
        );
      },
    });

    try {
      await savePromise;
    } catch (error) {
      console.error("Gagal simpan:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl w-full max-w-sm shadow-xl border border-zinc-200 dark:border-zinc-800 relative">
        {/* Tombol X untuk Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          Edit User
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nama Lengkap
            </label>
            <input
              required
              className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              required // Tambahkan required agar tidak kosong
              value={formData.username || ""}
              onChange={handleChange}
              className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="Masukkan username unik..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Password Baru
            </label>
            <input
              type="password"
              placeholder="Kosongkan jika tidak diubah"
              className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Role
            </label>
            <select
              required
              className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.role_id}
              onChange={(e) =>
                setFormData({ ...formData, role_id: e.target.value })
              }
            >
              <option value="">Pilih Role</option>
              {Array.isArray(roles) &&
                roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="w-4 h-4 rounded"
            />
            <label className="text-sm text-zinc-700 dark:text-zinc-300">
              Akun Aktif
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            {/* Tombol Batal - Warna netral agar tidak membingungkan */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Batal
            </button>

            {/* Tombol Simpan - Warna ORANYE agar senada dengan tombol Tambah */}
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors shadow-sm"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
