// frontend/src/layouts/MainLayout.jsx
import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { MENU } from "../constants/menuKeys";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  ShieldCheck,
  User,
  PanelLeft,
  ChevronRight,
  X,
  BrainCircuit,
  History,
  Database,
  BookText,
  FolderKanban,
  Mic,
  HelpCircle,
  Sun,
  Moon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MainLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState("");
  const [userData, setUserData] = useState({
    username: "",
    name: "",
  });

  const [theme, setTheme] = useState(() => {
    // Ambil dari localStorage, jika tidak ada, default ke 'dark' (sesuai keinginan Anda)
    const saved = localStorage.getItem("theme");
    return saved || "dark";
  });

  const location = useLocation();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/dashboard",
      menuKey: MENU.DASHBOARD,
    },
    {
      icon: BrainCircuit,
      label: "Knowledge Base",
      path: "/knowledge-base",
      menuKey: MENU.KNOWLEDGE_BASE,
    },
    {
      icon: History,
      label: "KB History",
      path: "/kb-history",
      menuKey: MENU.KB_HISTORY,
    },
    {
      icon: BookText,
      label: "KB Data",
      path: "/kb-data",
      menuKey: MENU.KB_DATA,
    },
    {
      icon: FolderKanban,
      label: "File Management",
      path: "/file-management",
      menuKey: MENU.FILE_MANAGEMENT,
    },
    {
      icon: Mic,
      label: "Recording",
      path: "/recording",
      menuKey: MENU.RECORDING,
    },
    {
      icon: Database,
      label: "Master Data",
      menuKey: MENU.ROLES, // Digunakan sebagai kunci utama untuk akses ke grup menu ini
      submenu: [
        {
          label: "Users",
          path: "/master/users",
          icon: User,
          menuKey: MENU.USERS,
        },
        {
          label: "Roles",
          path: "/master/roles",
          icon: ShieldCheck,
          menuKey: MENU.ROLES,
        },
        {
          label: "Suggested Questions",
          path: "/master/suggested-questions",
          icon: HelpCircle,
          menuKey: MENU.SUGGESTED_QUESTIONS,
        },
      ],
    },
    {
      icon: Settings,
      label: "Setting",
      path: "/setting",
      menuKey: MENU.SETTINGS,
    },
  ];

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem("user");
      if (savedData) setUserData(JSON.parse(savedData));
    } catch (error) {
      console.error("Gagal membaca data user", error);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const handleLogout = () => {
    if (confirm("Yakin ingin keluar dari sistem Kirana AI?")) {
      localStorage.clear();
      window.location.href = "/Login";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 font-sans antialiased overflow-x-hidden transition-colors duration-300">
      {/* OVERLAY MOBILE */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-zinc-950/20 dark:bg-black/60 z-40 lg:hidden backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR UTAMA */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-50 transition-all duration-300 flex flex-col overflow-hidden
          ${isOpen ? "translate-x-0 w-72" : "-translate-x-full"} 
          lg:translate-x-0
          ${isMinimized ? "lg:w-20" : "lg:w-72"}
        `}
      >
        {/* LOGO AREA */}
        <div className="p-4 h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-5 shrink-0 bg-transparent">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* 🌟 Mengembalikan background logo menjadi gradient orange-amber */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-black text-white text-base shrink-0 shadow-sm">
              K
            </div>
            {(!isMinimized || isOpen) && (
              <div className="flex flex-col whitespace-nowrap">
                <h2 className="text-md font-black text-zinc-600 dark:text-zinc-200 leading-tight tracking-tight">
                  KIRANA AI SYSTEM
                </h2>
                {/* 🌟 Mengembalikan warna teks sub-logo menjadi orange */}
                <span className="text-[9px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-[0.5px] leading-none">
                  Knowledge Base Platform
                </span>
              </div>
            )}
          </div>

          {isOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 -mr-2"
            >
              <X size={20} />
            </Button>
          )}
        </div>

        {/* LOGIKA SUBMENU COMPONENT SIDEBAR */}
        <Sidebar
          isMinimized={isOpen ? false : isMinimized}
          menuItems={menuItems}
          userData={userData}
          openSubmenu={openSubmenu}
          setOpenSubmenu={setOpenSubmenu}
          setIsOpen={setIsOpen}
        />
      </aside>

      {/* KONTEN SISI KANAN */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300
          ${isMinimized ? "lg:ml-20" : "lg:ml-72"}
        `}
      >
        {/* HEADER / TOPBAR */}
        <header
          className={`fixed top-0 right-0 h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 z-30 transition-all duration-300 left-0
            ${isMinimized ? "lg:pl-20" : "lg:pl-72"}
          `}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Menu size={24} />
            </Button>

            <button
              type="button"
              onClick={() => {
                setIsMinimized(!isMinimized);
                if (!isMinimized) setOpenSubmenu("");
              }}
              title={isMinimized ? "Expand Menu" : "Minimize Menu"}
              className="hidden lg:inline-flex shrink-0 items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-orange-700 dark:hover:text-orange-400 h-9 w-9 rounded-lg bg-zinc-50 dark:bg-zinc-800/30 ml-3"
            >
              {isMinimized ? (
                <ChevronRight
                  size={18}
                  className="text-orange-600 dark:text-orange-400 stroke-[2.5]"
                />
              ) : (
                <PanelLeft size={18} />
              )}
            </button>
          </div>

          {/* AKSI TOPBAR SISI KANAN */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={
                theme === "light"
                  ? "Switch to Dark Mode"
                  : "Switch to Light Mode"
              }
              className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 h-9 w-9 rounded-xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/50 transition-all"
            >
              {theme === "light" ? (
                <Moon size={18} className="text-zinc-700" />
              ) : (
                <Sun size={18} className="text-amber-400" />
              )}
            </Button>

            {/* DROPDOWN PROFILE */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/50 rounded-full lg:rounded-xl transition-all outline-none">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center text-white font-bold uppercase text-sm shadow-sm">
                    {userData?.username
                      ? userData.username.charAt(0).toUpperCase()
                      : "A"}
                  </div>
                  <div className="hidden md:flex flex-col text-left pr-2">
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-tight">
                      {userData?.username || "admin"}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-orange-600 dark:text-orange-400">
                      {userData?.name || "Administrator"}
                    </p>
                  </div>
                  <ChevronDown size={14} className="text-zinc-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-lg"
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-none">
                      {userData?.username || "admin"}
                    </p>
                    <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      {userData?.name || "Administrator"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                <DropdownMenuItem asChild>
                  <Link
                    to="/setting"
                    className="cursor-pointer flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 p-2 rounded-md transition-colors"
                  >
                    <User
                      size={16}
                      className="text-orange-600 dark:text-orange-400"
                    />
                    <span className="font-medium text-sm">
                      Profile Settings
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer flex items-center gap-2 p-2 rounded-md font-medium text-sm"
                >
                  <LogOut size={16} />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* AREA OUTLET HALAMAN */}
        <main className="flex-1 p-4 md:p-6 mt-16 overflow-x-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
