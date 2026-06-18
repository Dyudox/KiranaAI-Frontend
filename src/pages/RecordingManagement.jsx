import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
// 1. IMPORT PLUGIN REGIONS
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import axios from "axios";
import Pagination from "../components/Pagination";
import AnalyticsDrawer from "./AnalyticsDrawer";
import {
  Play,
  Pause,
  Search,
  Loader2,
  RefreshCw,
  FileAudio,
  BarChart3,
  User,
  Settings,
  FileText,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export default function RecordingManagement() {
  // === STATE DATA & UI ===
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState("");
  const [currentAudioName, setCurrentAudioName] = useState("");

  // === Recording Analitik ===
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);

  // === STATE FILTER & SEARCHING ===
  const [search, setSearch] = useState("");
  const [filterSetup, setFilterSetup] = useState("");
  const [filterAgent, setFilterAgent] = useState("");

  // --- STATE PAGINATION (SERVER-SIDE) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0); // 🌟 State baru untuk menampung total data dari database

  // --- STATE WAVESURFER PLAYER CONTROLS ---
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionsPluginRef = useRef(null); // Ref untuk menyimpan instance plugin region
  const [isWavePlaying, setIsWavePlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioDuration, setAudioDuration] = useState("0:00");
  const [audioCurrentTime, setAudioCurrentTime] = useState("0:00");
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/recordings", {
        // 🌟 SEKARANG MENYERTAKAN PARAMETER PAGE & LIMIT KE SERVER
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search,
          setup_id: filterSetup,
          agent_name: filterAgent,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Sesuaikan pembacaan dengan standarisasi data & total dari backend
      const hasilResponse = res.data.data || [];
      const totalDataDariServer = res.data.total || 0;

      setRecordings(hasilResponse);
      setTotalItems(totalDataDariServer); // 🌟 Simpan angka total baris asli ke state
    } catch (error) {
      console.error("Gagal memuat data rekaman:", error);
      toast.error("Gagal memuat daftar rekaman audio");
    } finally {
      setLoading(false);
    }
  };

  // 🌟 MEMICU FETCH ULANG KETIKA TRANSISED PAGE, LIMIT, ATAU FILTER BERUBAH
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRecordings();
    }, 500);
    return () => clearTimeout(handler);
  }, [currentPage, itemsPerPage, search, filterSetup, filterAgent]);

  // Reset halaman ke page 1 jika user mengganti kata kunci pencarian atau opsi filter select
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterSetup, filterAgent]);

  // ==========================================
  // EFFECT UNTUK INITIALISASI WAVESURFER + REGIONS
  // ==========================================
  useEffect(() => {
    if (!currentAudioUrl || !waveformRef.current) return;

    setIsAudioLoading(true);
    setIsWavePlaying(false);

    const wsRegions = RegionsPlugin.create();
    regionsPluginRef.current = wsRegions;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#d1d5db",
      progressColor: "#f97316",
      cursorColor: "#ea580c",
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 55,
      responsive: true,
      plugins: [wsRegions],
    });

    wavesurferRef.current = ws;
    ws.load(currentAudioUrl);

    wsRegions.enableDragSelection({
      color: "rgba(249, 115, 22, 0.2)",
    });

    wsRegions.on("region-created", (region) => {
      const currentRegions = wsRegions.getRegions();
      if (currentRegions.length > 1) {
        currentRegions[0].remove();
      }
      ws.setTime(region.start);
    });

    ws.on("ready", () => {
      setIsAudioLoading(false);
      setAudioDuration(formatTime(ws.getDuration()));
      ws.play().catch((err) => console.log("Autoplay diblokir:", err));
      setIsWavePlaying(true);
    });

    ws.on("audioprocess", () => {
      const currentTime = ws.getCurrentTime();
      setAudioCurrentTime(formatTime(currentTime));

      const activeRegions = wsRegions.getRegions();
      if (activeRegions.length > 0) {
        const activeRegion = activeRegions[0];
        if (currentTime >= activeRegion.end) {
          ws.setTime(activeRegion.start);
        }
      }
    });

    ws.on("interaction", () => {
      setAudioCurrentTime(formatTime(ws.getCurrentTime()));
    });

    ws.on("finish", () => {
      setIsWavePlaying(false);
      setActiveAudioId(null);
    });

    const isDarkMode = document.documentElement.classList.contains("dark");
    if (isDarkMode) {
      ws.setOptions({
        waveColor: "#334155",
        progressColor: "#f97316",
      });
    }

    return () => {
      ws.destroy();
    };
  }, [currentAudioUrl]);

  // ==========================================
  // HANDLER AUDIO CONTROL
  // ==========================================
  const handlePlayAudio = async (id, audioFileName) => {
    const audioUrl = `http://localhost:5000/api/recordings/audio/${id}`;

    if (activeAudioId === id) {
      if (wavesurferRef.current) {
        wavesurferRef.current.playPause();
        setIsWavePlaying(wavesurferRef.current.isPlaying());
        if (!wavesurferRef.current.isPlaying()) {
          setActiveAudioId(null);
        }
      }
    } else {
      try {
        const response = await fetch(audioUrl, {
          headers: { Range: "bytes=0-100" },
        });
        if (!response.ok) throw new Error("Gagal memuat file audio");

        setActiveAudioId(id);
        setCurrentAudioUrl(audioUrl);
        setCurrentAudioName(audioFileName || "Unnamed Recording");
      } catch (error) {
        toast.error(`Gagal memutar audio`);
        setActiveAudioId(null);
      }
    }
  };

  const togglePlayWave = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.playPause();
    const playing = wavesurferRef.current.isPlaying();
    setIsWavePlaying(playing);
    if (!playing) {
      setActiveAudioId(null);
    } else {
      const activeItem = recordings.find(
        (r) =>
          `http://localhost:5000/api/recordings/audio/${r.id}` ===
          currentAudioUrl,
      );
      if (activeItem) setActiveAudioId(activeItem.id);
    }
  };

  const clearSelection = () => {
    if (regionsPluginRef.current) {
      regionsPluginRef.current.clearRegions();
    }
  };

  const toggleMuteWave = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.setMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  const skipWave = (seconds) => {
    if (!wavesurferRef.current) return;
    const timeNow = wavesurferRef.current.getCurrentTime();
    wavesurferRef.current.setTime(timeNow + seconds);
  };

  const handleDownloadAudio = async () => {
    if (!currentAudioUrl) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(currentAudioUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute(
        "download",
        currentAudioName.endsWith(".wav")
          ? currentAudioName
          : `${currentAudioName}.wav`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error("Gagal mengunduh file audio");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-transparent text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* HEADER SECTION */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Recording Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Daftar rekaman percakapan, transkrip, audio, dan ringkasan AI output
          </p>
        </div>
        <button
          onClick={fetchRecordings}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-white dark:bg-zinc-800 border border-stone-200 dark:border-slate-800/80 shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Cari nama recording..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-950 text-slate-800 dark:text-slate-200"
          />
        </div>

        <select
          value={filterSetup}
          onChange={(e) => setFilterSetup(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm outline-none bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-950 text-slate-700 dark:text-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Semua Setup</option>
          <option value="built-in">Built-in</option>
          <option value="custom-v1">Custom V1</option>
        </select>

        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm outline-none bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-950 text-slate-700 dark:text-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Semua Agent</option>
          <option value="agent">Default Agent</option>
          <option value="telemarketing">Telemarketing</option>
          <option value="customer-service">Customer Service</option>
        </select>
      </div>

      {/* WAVEPLAYER MEDIA PLAYER */}
      {currentAudioUrl && (
        <div className="mb-6 p-4 rounded-xl border bg-white dark:bg-zinc-800 border border-stone-200 dark:border-slate-800/80 shadow-sm transition-all animate-fadeIn">
          <div className="flex flex-col gap-3">
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                  <FileAudio
                    size={14}
                    className={isWavePlaying ? "animate-pulse" : ""}
                  />
                  <span className="truncate">Playing: {currentAudioName}</span>
                </div>
                <span className="text-slate-400 italic text-[10px]">
                  💡 Tips: Klik & Seret mouse pada ombak suara untuk memblok
                  rentang waktu
                </span>
              </div>

              <div className="relative bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-900 rounded-lg p-3 min-h-[55px]">
                {isAudioLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 rounded-lg z-10">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Loader2
                        size={14}
                        className="animate-spin text-orange-500"
                      />
                      <span>Generating soundwaves...</span>
                    </div>
                  </div>
                )}
                <div ref={waveformRef} className="w-full cursor-ew-resize" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 select-none border-t border-slate-100 dark:border-slate-800/60 pt-3">
              <div className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-900 w-full sm:w-auto text-center sm:text-left">
                {audioCurrentTime}{" "}
                <span className="text-slate-300 dark:text-slate-700 mx-0.5">
                  /
                </span>{" "}
                {audioDuration}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => skipWave(-10)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer"
                  title="Mundur 10 detik"
                >
                  <SkipBack
                    size={15}
                    fill="currentColor"
                    className="opacity-85"
                  />
                </button>

                <button
                  onClick={togglePlayWave}
                  className="p-2.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-sm cursor-pointer flex items-center justify-center"
                  title={isWavePlaying ? "Pause" : "Play"}
                >
                  {isWavePlaying ? (
                    <Pause size={16} fill="currentColor" />
                  ) : (
                    <Play size={16} fill="currentColor" className="ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => skipWave(10)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer"
                  title="Maju 10 detik"
                >
                  <SkipForward
                    size={15}
                    fill="currentColor"
                    className="opacity-85"
                  />
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <button
                  onClick={clearSelection}
                  className="p-2 text-xs font-medium text-slate-500 hover:text-red-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  Hapus Blok
                </button>

                <button
                  onClick={toggleMuteWave}
                  className={`p-2 rounded-lg cursor-pointer border ${isMuted ? "border-red-200 bg-red-50 text-red-500 dark:bg-red-950/20 dark:border-red-900/30" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800"}`}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>

                <button
                  onClick={handleDownloadAudio}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                >
                  <Download size={15} />
                  <span className="hidden md:inline">Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STRUKTUR TABEL RECORDING */}
      <div className="border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-800 border border-stone-200 dark:border-slate-800/80">
        <div className="overflow-x-auto bg-transparent scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b font-semibold bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4 w-24 text-center">Action</th>
                <th className="p-4 w-36">Tanggal</th>
                <th className="p-4 min-w-[200px]">Recording Name</th>
                <th className="p-4 w-40">User/Agent</th>
                <th className="p-4 w-32">Setup</th>
                <th className="p-4 max-w-xs">Ringkasan AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 dark:bg-zinc-900">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-8 text-center text-slate-400 dark:text-slate-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span>Memuat data rekaman...</span>
                    </div>
                  </td>
                </tr>
              ) : recordings.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-8 text-center text-slate-400 dark:text-slate-500"
                  >
                    Tidak ada data hasil rekaman audio ditemukan.
                  </td>
                </tr>
              ) : (
                /* 🌟 SEKARANG MENAMPILKAN LANGSUNG DARI ARRAYS RECORDING HASIL CICILAN SERVER */
                recordings.map((item, index) => {
                  const isCurrentPlaying = activeAudioId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors text-slate-700 dark:text-slate-200"
                    >
                      <td className="p-4 text-center text-slate-400 dark:text-slate-500 font-medium">
                        {/* 🌟 PENOMORAN MATEMATIS AGAR BERLANJUT DI HALAMAN 2, 3, DST */}
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() =>
                              handlePlayAudio(item.id, item.file_name)
                            }
                            className={`p-2 rounded-full transition shadow-sm border cursor-pointer ${
                              isCurrentPlaying && isWavePlaying
                                ? "bg-orange-600 border-orange-600 text-white animate-pulse"
                                : "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/60 text-orange-600 dark:text-orange-400 hover:bg-orange-600 hover:text-white"
                            }`}
                          >
                            {isCurrentPlaying && isWavePlaying ? (
                              <Pause size={14} />
                            ) : (
                              <Play size={14} />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedRecording(item);
                              setIsDrawerOpen(true);
                            }}
                            className="p-2 rounded-full transition shadow-sm border bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white cursor-pointer"
                          >
                            <BarChart3 size={14} />
                          </button>
                        </div>
                      </td>

                      <td className="p-4 text-xs text-slate-400 dark:text-slate-500">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "-"}
                      </td>

                      <td
                        className="p-4 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate"
                        title={item.file_name}
                      >
                        <div className="flex items-center gap-2">
                          <FileAudio
                            size={16}
                            className="text-zinc-400 shrink-0"
                          />
                          <span className="truncate">
                            {item.file_name || "Unnamed Recording"}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-slate-400" />
                          <span>{item.agent_name || "agent"}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded border bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/10">
                          <Settings size={12} />
                          {item.setup_id || "built-in"}
                        </span>
                      </td>

                      <td
                        className="p-4 max-w-xs text-xs text-slate-500 dark:text-slate-400 truncate"
                        title={(() => {
                          if (!item.result) return "Tidak ada data.";
                          if (typeof item.result === "object")
                            return (
                              item.result?.prompt_summary_json?.rangkuman ||
                              "Tidak ada rangkuman."
                            );

                          const match = item.result.match(
                            /"rangkuman"\s*:\s*"([^"]+)"/,
                          );
                          return match ? match[1] : "Tidak ada ringkasan.";
                        })()}
                      >
                        <div className="flex items-center gap-1">
                          <FileText
                            size={14}
                            className="text-slate-400 shrink-0"
                          />
                          <span className="truncate">
                            {(() => {
                              try {
                                if (!item.result) return "Tidak ada ringkasan.";

                                if (typeof item.result === "object") {
                                  return (
                                    item.result?.prompt_summary_json
                                      ?.rangkuman || "Rangkuman kosong."
                                  );
                                }

                                const match = item.result.match(
                                  /"rangkuman"\s*:\s*"([^"]+)"/,
                                );

                                if (match && match[1]) {
                                  return match[1];
                                }

                                let cleanString = item.result.substring(
                                  item.result.indexOf("{"),
                                  item.result.lastIndexOf("}") + 1,
                                );
                                const parsedResult = JSON.parse(cleanString);
                                return (
                                  parsedResult?.prompt_summary_json
                                    ?.rangkuman || "Rangkuman kosong."
                                );
                              } catch (e) {
                                console.error(
                                  `🔴 Regex & JSON Parse menyerah di ID ${item.id}. Error:`,
                                  e.message,
                                );
                                return "Format data bermasalah.";
                              }
                            })()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 🌟 MEMASANG STATE TOTAL ITEMS DARI SERVER */}
        <Pagination
          data={recordings}
          totalItems={totalItems} // 🌟 Ditambahkan agar Pagination tahu batas akhir halaman di database
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
        />
      </div>

      <AnalyticsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        recordingData={selectedRecording}
      />
    </div>
  );
}
