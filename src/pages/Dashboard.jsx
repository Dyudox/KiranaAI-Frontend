import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FileAudio,
  FolderOpen,
  MessageSquare,
  Users,
  Loader2,
  Clock,
  ArrowUpRight,
  Upload,
  FileText,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recentActivities, setRecentActivities] = useState({
    recentRecordings: [],
    recentChats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resStats, resChart, resRecent] = await Promise.all([
          axios.get("http://localhost:5000/api/dashboard/stats"),
          axios.get("http://localhost:5000/api/dashboard/chart"),
          axios.get("http://localhost:5000/api/dashboard/recent"),
        ]);

        if (resStats.data.success) setStats(resStats.data.data);
        if (resChart.data.success) setChartData(resChart.data.data);
        if (resRecent.data.success) setRecentActivities(resRecent.data.data);
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        toast.error("Gagal memuat data dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return (
      date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
      " WIB"
    );
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  const cards = [
    {
      title: "Total Rekaman",
      value: stats?.totalRecordings?.toLocaleString("id-ID") || 0,
      icon: FileAudio,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Pustaka Pengetahuan",
      value: `${stats?.totalDocuments || 0} File`,
      icon: FolderOpen,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Interaksi AI (Hari Ini)",
      value: stats?.aiHitsToday || 0,
      icon: MessageSquare,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Total Pengguna",
      value: stats?.totalUsers || 0,
      icon: Users,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
  ];

  // Data konfigurasi untuk Tombol Menu Cepat
  const quickActions = [
    {
      label: "Unggah Rekaman Baru",
      desc: "Proses transkrip audio baru",
      icon: Upload,
      color:
        "border-blue-200 hover:border-blue-500 dark:border-stone-800 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10",
      path: "/recording", // Sesuaikan dengan path route navigasi Anda
    },
    {
      label: "Tambah Dokumen AI",
      desc: "Latih basis pengetahuan Kirana",
      icon: FileText,
      color:
        "border-amber-200 hover:border-amber-500 dark:border-stone-800 text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/10",
      path: "/file-management", // Sesuaikan dengan path route navigasi Anda
    },
    {
      label: "Registrasi Pengguna",
      desc: "Tambah akun agent atau admin baru",
      icon: UserPlus,
      color:
        "border-purple-200 hover:border-purple-500 dark:border-stone-800 text-purple-600 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/10",
      path: "/master/users", // Sesuaikan dengan path route navigasi Anda
    },
  ];

  return (
    <div className="p-6 space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Pusat pemantauan berkas rekaman dan metrik AI
        </p>
      </div>

      {/* Bagian 1: Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">
                  {card.title}
                </span>
                <span className="text-2xl font-bold text-stone-900 dark:text-white block">
                  {card.value}
                </span>
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <IconComponent className={card.iconColor} size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bagian 2: Grafik */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-stone-900 dark:text-white">
            Tren Masuk Berkas Rekaman
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Jumlah aktivitas rekaman audio 7 hari terakhir
          </p>
        </div>
        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-stone-400">
              Belum ada data rekaman.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e7e5e4"
                  className="dark:stroke-stone-800"
                />
                <XAxis
                  dataKey="name"
                  stroke="#a8a29e"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#a8a29e"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgb(28 25 23)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                    border: "none",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Total Rekaman"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bagian 3: Aktivitas Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabel Kiri */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                Rekaman Masuk Terakhir
              </h3>
              <p className="text-xxs text-stone-400">
                5 Audio transkrip terbaru yang berhasil diolah
              </p>
            </div>
            <Clock size={16} className="text-stone-400" />
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {recentActivities.recentRecordings.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">
                Tidak ada aktivitas rekaman baru.
              </p>
            ) : (
              recentActivities.recentRecordings.map((rec) => (
                <div
                  key={rec.id}
                  className="py-3 flex items-center justify-between group"
                >
                  <div className="space-y-0.5 truncate max-w-[70%]">
                    <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate group-hover:text-blue-500 transition-colors">
                      {rec.file_name}
                    </p>
                    <span className="text-xxs text-stone-400 block">
                      {formatTime(rec.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate("/recordings")}
                    className="p-1 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tabel Kanan */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                Log Pertanyaan Kirana AI
              </h3>
              <p className="text-xxs text-stone-400">
                Interaksi obrolan user dengan model pengetahuan
              </p>
            </div>
            <MessageSquare size={16} className="text-stone-400" />
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {recentActivities.recentChats.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">
                Belum ada aktivitas obrolan AI hari ini.
              </p>
            ) : (
              recentActivities.recentChats.map((chat) => (
                <div
                  key={chat.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="space-y-0.5 max-w-[85%]">
                    <p className="text-xs font-medium text-stone-700 dark:text-stone-300 italic line-clamp-1">
                      "{chat.message}"
                    </p>
                    <span className="text-xxs text-stone-400 block">
                      {formatTime(chat.created_at)}
                    </span>
                  </div>
                  <span className="text-xxs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                    Sukses
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 🌟 Bagian 4: Pusat Kendali Cepat (Quick Actions) */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
            Aksi Cepat
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Pintas kendali navigasi operasional harian
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all transform hover:-translate-y-0.5 shadow-sm bg-white dark:bg-stone-900 ${action.color}`}
              >
                <div className="p-2 rounded-lg bg-white dark:bg-stone-800 shadow-xs border border-stone-100 dark:border-stone-700 mt-0.5">
                  <ActionIcon size={18} />
                </div>
                <div className="space-y-0.5 truncate">
                  <span className="text-xs font-bold text-stone-900 dark:text-white block truncate">
                    {action.label}
                  </span>
                  <span className="text-xxs text-stone-500 dark:text-stone-400 block truncate">
                    {action.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
