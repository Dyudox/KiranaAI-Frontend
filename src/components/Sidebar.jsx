// frontend/src/components/Sidebar.jsx
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

export function Sidebar({
  isMinimized,
  menuItems,
  openSubmenu,
  setOpenSubmenu,
  setIsOpen,
}) {
  const location = useLocation();
  const { userPermissions } = useContext(AuthContext);

  // Fungsi pengecekan akses baca (menggunakan menuKey & can_read dari DB)
  const canRead = (key) => {
    if (!key) return true;
    const permission = userPermissions?.find((p) => p.menu_key === key);

    // 🔍 LOG KHUSUS UNTUK MEMANTAU DASHBOARD
    // if (key === "dashboard") {
    //   console.log("=== DIAGNOSA MENU DASHBOARD ===");
    //   console.log("menuKey yang dicari:", key);
    //   console.log("Objek permission ditemukan:", permission);
    //   console.log(
    //     "Apakah can_read bernilai true?:",
    //     permission ? permission.can_read === true : false,
    //   );
    //   console.log("===============================");
    // }

    return permission ? permission.can_read === true : false;
  };

  // Filter menuItems agar sesuai dengan permission (menggunakan menuKey)
  const filteredMenuItems = menuItems
    .filter((item) => canRead(item.menuKey)) // 1. Cek menu utama dulu
    .map((item) => {
      // 2. Jika punya submenu, filter anak-anaknya
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter((sub) => canRead(sub.menuKey)),
        };
      }
      return item;
    })
    // 3. Filter akhir: Sembunyikan jika menu tipe grup tapi semua submenunya kosong
    .filter((item) => !item.submenu || item.submenu.length > 0);

  const isActive = (path) => location.pathname === path;

  const isSubmenuActive = (submenu) => {
    return submenu?.some((sub) => location.pathname === sub.path);
  };

  const handleMenuClick = (item) => {
    if (item.submenu) {
      setOpenSubmenu(openSubmenu === item.label ? "" : item.label);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 custom-scrollbar">
      {filteredMenuItems.map((item, index) => {
        const Icon = item.icon;
        const hasSubmenu = !!item.submenu;
        const isSubOpen =
          openSubmenu === item.label || isSubmenuActive(item.submenu);
        const menuActive =
          isActive(item.path) ||
          (!isMinimized && isSubmenuActive(item.submenu));

        return (
          <div key={index} className="w-full">
            {/* 🏷️ MENU UTAMA / PARENT MENU */}
            {item.path ? (
              <Link
                to={item.path}
                onClick={() => handleMenuClick(item)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                  ${
                    isActive(item.path)
                      ? "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-orange-100/50 dark:hover:bg-zinc-800/60 hover:text-orange-700 dark:hover:text-orange-400"
                  }
                  ${isMinimized ? "justify-center px-0 h-11 w-11 mx-auto" : ""}
                `}
                title={isMinimized ? item.label : ""}
              >
                <Icon
                  size={20}
                  className={`shrink-0 ${isActive(item.path) ? "text-emerald-500 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400 group-hover:text-orange-600 dark:group-hover:text-orange-400"}`}
                />
                {!isMinimized && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => handleMenuClick(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${
                    menuActive
                      ? "bg-orange-100/40 text-orange-700 dark:bg-zinc-800/80 dark:text-zinc-200 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-orange-100/50 dark:hover:bg-zinc-800/60 hover:text-orange-700 dark:hover:text-orange-400"
                  }
                  ${isMinimized ? "justify-center px-0 h-11 w-11 mx-auto" : ""}
                `}
                title={isMinimized ? item.label : ""}
              >
                <Icon
                  size={20}
                  className={`shrink-0 ${menuActive ? "text-orange-600 dark:text-orange-400" : "text-zinc-500 dark:text-zinc-400 group-hover:text-orange-600 dark:group-hover:text-orange-400"}`}
                />
                {!isMinimized && (
                  <>
                    <span className="truncate flex-1 text-left">
                      {item.label}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-zinc-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 group-hover:text-orange-600 dark:group-hover:text-orange-400
                        ${openSubmenu === item.label ? "rotate-180" : ""}
                      `}
                    />
                  </>
                )}
              </button>
            )}

            {/* 🔽 AREA SUB-MENU (ANAKAN MENU) */}
            {hasSubmenu && isSubOpen && !isMinimized && (
              <div className="mt-1 ml-4 pl-3 border-l border-zinc-200 dark:border-zinc-800 space-y-1 transition-all duration-300">
                {item.submenu.map((sub, subIndex) => {
                  const SubIcon = sub.icon;
                  return (
                    <Link
                      key={subIndex}
                      to={sub.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150
                        ${
                          isActive(sub.path)
                            ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 dark:bg-emerald-500/10"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-100/30 dark:hover:bg-zinc-800/40"
                        }
                      `}
                    >
                      {SubIcon && (
                        <SubIcon
                          size={16}
                          className={`shrink-0 ${isActive(sub.path) ? "text-emerald-500 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"}`}
                        />
                      )}
                      <span className="truncate">{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Sidebar;
