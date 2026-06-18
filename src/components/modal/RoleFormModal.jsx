import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { MENU } from "../../constants/menuKeys";

const RoleFormModal = ({ role, onClose, onRefresh }) => {
  const [formData, setFormData] = useState(
    role || { name: "", description: "" },
  );
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load permissions saat edit
  useEffect(() => {
    const fetchPermissions = async () => {
      // Pastikan modal hanya memproses jika mode EDIT (role & role.id ada)
      if (!role || !role.id) return;

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/roles/permissions/${role.id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        // JIKA DATA DI DATABASE KOSONG ([]), KITA SINKRONKAN DENGAN menuKeys.js
        if (!res.data || res.data.length === 0) {
          // Ambil semua value dari objek MENU aman tanpa crash
          const menuKeysArray = MENU ? Object.values(MENU) : [];

          const defaultData = menuKeysArray.map((key) => ({
            menu_key: key,
            can_create: false,
            can_read: false,
            can_update: false,
            can_delete: false,
          }));

          setPermissions(defaultData);
        } else {
          setPermissions(res.data);
        }
      } catch (err) {
        console.error("Gagal memuat permission:", err);
      }
    };

    fetchPermissions();
  }, [role]);

  const handlePermissionChange = (menuKey, action) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.menu_key === menuKey ? { ...p, [action]: !p[action] } : p,
      ),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (role) {
        // Mode Edit: Update Role & Permissions
        await axios.put(
          `http://localhost:5000/api/roles/${role.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        await axios.put(
          `http://localhost:5000/api/roles/permissions/${role.id}`,
          { permissions: permissions },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Role berhasil diperbarui!");
      } else {
        // Mode Tambah: Hanya buat Role baru
        await axios.post(`http://localhost:5000/api/roles`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Role berhasil ditambahkan!");
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error("Gagal menyimpan:", err.response?.data);
      toast.error("Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-bold mb-4 dark:text-white">
          {role ? "Edit Role" : "Tambah Role"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. BAGIAN INPUT: HANYA MUNCUL JIKA TAMBAH (role null) */}
          {!role && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Role
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Contoh: Admin, Kasir"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Jelaskan fungsi role ini..."
                  rows="2"
                />
              </div>
            </div>
          )}

          {/* 2. BAGIAN PERMISSION: HANYA MUNCUL JIKA EDIT (ada role) */}
          {role && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2 dark:text-white">
                Pengaturan Akses
              </h3>
              <table className="w-full text-sm dark:text-zinc-300">
                {/* ... isi tabel seperti biasa ... */}
                <thead>
                  <tr className="border-b dark:border-zinc-700">
                    <th className="text-left py-2">Menu</th>
                    <th>Create</th>
                    <th>Read</th>
                    <th>Update</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((p) => (
                    <tr
                      key={p.menu_key}
                      className="border-b dark:border-zinc-700"
                    >
                      <td className="py-2 capitalize">
                        {p.menu_key.replace(/-/g, " ")}
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={p.can_create}
                          onChange={() =>
                            handlePermissionChange(p.menu_key, "can_create")
                          }
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={p.can_read}
                          onChange={() =>
                            handlePermissionChange(p.menu_key, "can_read")
                          }
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={p.can_update}
                          onChange={() =>
                            handlePermissionChange(p.menu_key, "can_update")
                          }
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={p.can_delete}
                          onChange={() =>
                            handlePermissionChange(p.menu_key, "can_delete")
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-600"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg"
            >
              {loading ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleFormModal;
