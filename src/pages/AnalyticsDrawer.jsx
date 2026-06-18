import React, { useRef, useState, useEffect } from "react";
import Draggable from "react-draggable";
import {
  X,
  Move,
  ClipboardList,
  BarChart3,
  MessageSquareText,
  ShieldAlert,
  UserCheck,
  Layers,
} from "lucide-react";

export default function AnalyticsDrawer({ isOpen, onClose, recordingData }) {
  const nodeRef = useRef(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi ukuran layar secara real-time untuk penyesuaian responsif
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Layar di bawah 768px dianggap Mobile/HP
    };

    handleResize(); // Jalankan sekali saat mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isOpen || !recordingData) return null;

  // =========================================================
  // 🚀 ULTIMATE SMART PARSER: ANTI TRAILING COMMAS & BAD OBJECTS
  // =========================================================
  let result = {};

  const cleanAndParseComponent = (str) => {
    try {
      let text = str.trim();
      if (text.endsWith(",")) text = text.slice(0, -1).trim();
      if (!text.startsWith("{")) text = "{" + text;
      if (!text.endsWith("}")) text = text + "}";
      text = text.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(text);
    } catch (e) {
      const fallbackObj = {};
      const keys = [
        "prompt_summary_json",
        "prompt_collector_json",
        "prompt_score_agent_common_json",
        "prompt_score_customer_json",
        "prompt_ancaman_json",
      ];

      keys.forEach((key) => {
        if (str.includes(key)) {
          const regex = new RegExp(
            `"${key}"\\s*:\\s*(\\{.*?\\})(?=\\s*,"prompt_|\\s*\\})`,
            "s",
          );
          const match = str.match(regex);
          if (match && match[1]) {
            try {
              let blockText = match[1].replace(/,\s*([}\]])/g, "$1");
              fallbackObj[key] = JSON.parse(blockText);
            } catch (innerErr) {
              try {
                let fixedBlock = match[1]
                  .replace(/\\"/g, '"')
                  .replace(/[\r\n\t]/g, " ")
                  .replace(/,\s*([}\]])/g, "$1");
                fallbackObj[key] = JSON.parse(fixedBlock);
              } catch {}
            }
          }
        }
      });
      return fallbackObj;
    }
  };

  try {
    if (recordingData.result) {
      let rawString =
        typeof recordingData.result === "string"
          ? recordingData.result
          : JSON.stringify(recordingData.result);
      rawString = rawString.replace(/[\r\n\t]/g, " ").trim();

      if (!rawString.startsWith("[")) {
        let wrappedString = "[" + rawString.replace(/,\s*([}\]])/g, "$1") + "]";
        try {
          let directParse = JSON.parse(wrappedString);
          if (Array.isArray(directParse)) {
            directParse.forEach((obj) => {
              if (obj) result = { ...result, ...obj };
            });
          }
        } catch {
          const blocks = rawString.split(/(?=\{"prompt_)|(?=,"prompt_)/g);
          blocks.forEach((block) => {
            let cleanBlock = block.trim();
            if (cleanBlock.startsWith(","))
              cleanBlock = cleanBlock.substring(1).trim();
            if (cleanBlock.startsWith("["))
              cleanBlock = cleanBlock.substring(1).trim();
            if (cleanBlock.endsWith("]"))
              cleanBlock = cleanBlock
                .substring(0, cleanBlock.length - 1)
                .trim();
            if (cleanBlock) {
              const parsedBlock = cleanAndParseComponent(cleanBlock);
              result = { ...result, ...parsedBlock };
            }
          });
        }
      } else {
        try {
          let cleanArrayString = rawString.replace(/,\s*([}\]])/g, "$1");
          let directParse = JSON.parse(cleanArrayString);
          directParse.forEach((obj) => {
            if (obj) result = { ...result, ...obj };
          });
        } catch {
          const blocks = rawString.split(/(?=\{"prompt_)|(?=,"prompt_)/g);
          blocks.forEach((block) => {
            let cleanBlock = block.trim();
            if (cleanBlock.startsWith(","))
              cleanBlock = cleanBlock.substring(1).trim();
            if (cleanBlock.startsWith("["))
              cleanBlock = cleanBlock.substring(1).trim();
            if (cleanBlock.endsWith("]"))
              cleanBlock = cleanBlock
                .substring(0, cleanBlock.length - 1)
                .trim();
            if (cleanBlock) {
              const parsedBlock = cleanAndParseComponent(cleanBlock);
              result = { ...result, ...parsedBlock };
            }
          });
        }
      }
    }
  } catch (globalError) {
    console.error("Gagal total memproses data:", globalError);
  }

  const summary = result?.prompt_summary_json || {};
  const collector = result?.prompt_collector_json || {};
  const agentScore = result?.prompt_score_agent_common_json || {};
  const customerScore = result?.prompt_score_customer_json || {};
  const ancaman = result?.prompt_ancaman_json || {};

  const sisaKeyLain = Object.keys(result).filter(
    (key) =>
      ![
        "prompt_summary_json",
        "prompt_collector_json",
        "prompt_score_agent_common_json",
        "prompt_score_customer_json",
        "prompt_ancaman_json",
      ].includes(key),
  );

  // Helper fungsi untuk menentukan warna progress bar Skor Agen secara dinamis
  const getAgentBarColor = (score) => {
    // Jika skala maksimal nilai adalah 10, kita normalisasi ke 100
    const finalScore = score <= 10 ? score * 10 : score;
    if (finalScore < 50) return "bg-red-500 text-red-600 dark:text-red-400";
    if (finalScore < 75)
      return "bg-amber-500 text-amber-600 dark:text-amber-400";
    if (finalScore < 90)
      return "bg-indigo-500 text-indigo-600 dark:text-indigo-400";
    return "bg-emerald-500 text-emerald-600 dark:text-emerald-400";
  };

  // =========================================================
  // INTERFACE RENDERING STRATEGY (MOBILE VS DESKTOP)
  // =========================================================
  const renderContent = () => (
    <div
      ref={nodeRef}
      className={`bg-white dark:bg-slate-900 flex flex-col border border-slate-200 dark:border-slate-800 pointer-events-auto transition-colors duration-300 overflow-hidden shadow-2xl
        ${
          isMobile
            ? "w-full h-[85vh] rounded-t-2xl fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
            : "w-[620px] h-[580px] rounded-2xl"
        }`}
    >
      {/* Header Panel */}
      <div
        className={`drag-header px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 shadow-sm select-none ${isMobile ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
      >
        <div className="flex items-center gap-2">
          {!isMobile && (
            <Move size={16} className="text-slate-400 dark:text-slate-500" />
          )}
          <div>
            <h2 className="text-sm font-bold tracking-wide">
              ✨ Kirana Quality Assurance Evaluation
            </h2>
            <div className="flex flex-col sm:flex-row sm:gap-2 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
              {/* <span>ID Rekaman: {recordingData?.id || "-"}</span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">
                |
              </span> */}
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Recording : {recordingData?.file_name + `.wav` || "-"}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="no-drag p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition cursor-pointer flex items-center justify-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigasi Tab */}
      <div
        className="no-drag flex overflow-x-auto overflow-y-hidden border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1 gap-1 select-none text-[11px]"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--scrollbar-thumb, #6366f1) transparent",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .no-drag::-webkit-scrollbar { height: 4px !important; display: block !important; }
          .no-drag::-webkit-scrollbar-track { background: transparent !important; }
          .no-drag::-webkit-scrollbar-thumb { background-color: #6366f1 !important; border-radius: 10px !important; }
          .dark .no-drag::-webkit-scrollbar-thumb { background-color: #4f46e5 !important; }
        `,
          }}
        />

        <button
          onClick={() => setActiveTab("summary")}
          className={`whitespace-nowrap py-1.5 px-3 rounded-lg font-medium flex items-center gap-1 transition ${activeTab === "summary" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
        >
          <MessageSquareText size={12} /> Rangkuman
        </button>
        <button
          onClick={() => setActiveTab("collector")}
          className={`whitespace-nowrap py-1.5 px-3 rounded-lg font-medium flex items-center gap-1 transition ${activeTab === "collector" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
        >
          <ClipboardList size={12} /> Data Cust
        </button>
        <button
          onClick={() => setActiveTab("agent")}
          className={`whitespace-nowrap py-1.5 px-3 rounded-lg font-medium flex items-center gap-1 transition ${activeTab === "agent" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
        >
          <UserCheck size={12} /> Skor Agen
        </button>
        <button
          onClick={() => setActiveTab("customer")}
          className={`whitespace-nowrap py-1.5 px-3 rounded-lg font-medium flex items-center gap-1 transition ${activeTab === "customer" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
        >
          <BarChart3 size={12} /> Emosi Cust
        </button>
        <button
          onClick={() => setActiveTab("ancaman")}
          className={`whitespace-nowrap py-1.5 px-3 rounded-lg font-medium flex items-center gap-1 transition ${activeTab === "ancaman" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
        >
          <ShieldAlert size={12} /> Ancaman
        </button>
        {sisaKeyLain.length > 0 && (
          <button
            onClick={() => setActiveTab("extra")}
            className={`whitespace-nowrap py-1.5 px-3 rounded-lg font-medium flex items-center gap-1 transition ${activeTab === "extra" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
          >
            <Layers size={12} /> Lainnya
          </button>
        )}
      </div>

      {/* Area Konten Utama */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 text-slate-700 dark:text-slate-300 standard-scrollbar scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent bg-white dark:bg-zinc-900 pb-10">
        {/* TAB 1: RANGKUMAN */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                Rangkuman Utama Percakapan
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {summary.rangkuman || "Tidak ada data rangkuman."}
              </p>
            </div>
            {summary.poin_penting && (
              <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/10">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Poin Penting (Highlights)
                </h3>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {Array.isArray(summary.poin_penting) ? (
                    summary.poin_penting.map((poin, i) => (
                      <li key={i}>{poin}</li>
                    ))
                  ) : (
                    <li>{summary.poin_penting}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DATA CUSTOMER */}
        {activeTab === "collector" && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40 sm:col-span-2 flex flex-col sm:flex-row justify-between gap-2 sm:items-center">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">
                    Agent / Desk Officer
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {collector.agent || "-"}
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                    Nama Customer
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {collector.nama_cust || "-"}
                  </span>
                </div>
              </div>
              <div className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Nomor Telepon
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {collector.phone_cust || "-"}
                </span>
              </div>
              <div className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Email
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {collector.email_cust || "-"}
                </span>
              </div>
              <div className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Nama Kantor
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {collector.nama_kantor_cust || "-"}
                </span>
              </div>
              <div className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Alamat Kantor
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {collector.alamat_kantor_cust || "-"}
                </span>
              </div>
              <div className="sm:col-span-2 p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Alamat Rumah
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {collector.alamat_cust || "-"}
                </span>
              </div>
            </div>

            <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/20 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                🚗 Data Kendaraan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">
                    Mobil
                  </span>
                  <span className="font-medium">
                    {collector.jenis_mobil_cust || "-"}{" "}
                    {collector.plat_mobil_cust
                      ? `(${collector.plat_mobil_cust})`
                      : ""}
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block uppercase">
                    Motor
                  </span>
                  <span className="font-medium">
                    {collector.jenis_motor_cust || "-"}{" "}
                    {collector.plat_motor_cust
                      ? `(${collector.plat_motor_cust})`
                      : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/30 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                💡 Informasi Tambahan & Bukti Transaksi
              </h4>
              {collector.info_lain && collector.info_lain.length > 0 ? (
                <ul className="list-inside list-decimal space-y-1 text-slate-700 dark:text-slate-300">
                  {collector.info_lain.map((info, idx) => (
                    <li
                      key={idx}
                      className="text-xs leading-relaxed bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                      {info}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic text-[11px]">
                  Tidak ada catatan info tambahan.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SKOR AGEN (Progress bar adaptif berdasarkan tingkatan nilai) */}
        {activeTab === "agent" && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[11px]">
                Penilaian Parameter Agen
              </h3>
              {Object.keys(agentScore).map((key) => {
                const val = agentScore[key];
                const isScore = !isNaN(val) && !isNaN(parseFloat(val));
                if (isScore) {
                  const num = parseFloat(val);
                  const colorClasses = getAgentBarColor(num);
                  const barColor = colorClasses.split(" ")[0];
                  const textColor = colorClasses.split(" ").slice(1).join(" ");

                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="capitalize text-slate-600 dark:text-slate-400">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className={`font-bold ${textColor}`}>{num}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-1.5">
                        <div
                          className={`${barColor} h-1.5 rounded-full transition-all duration-500`}
                          style={{ width: `${num <= 10 ? num * 10 : num}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={key}
                    className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-1"
                  >
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      {key.replace(/_/g, " ")}
                    </span>
                    <p className="text-xs italic text-slate-600 dark:text-slate-300 mt-0.5">
                      "{String(val)}"
                    </p>
                  </div>
                );
              })}
              {Object.keys(agentScore).length === 0 && (
                <p className="text-slate-400 italic">
                  Tidak ada data penilaian agen.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EMOSI & SKOR CUSTOMER (Progress bar tematik berbeda-beda tiap parameter) */}
        {activeTab === "customer" && (
          <div className="space-y-4 text-xs">
            {/* 1. Indeks Kepuasan (CSAT) -> Emerald / Hijau Sukses */}
            <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  😊 Indeks Kepuasan Customer (CSAT)
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {customerScore.kepuasan_customer || 0}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-2">
                <div
                  className="bg-emerald-500 dark:bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${parseInt(customerScore.kepuasan_customer || 0, 10)}%`,
                  }}
                ></div>
              </div>
              {customerScore.kepuasan_customer_alasan && (
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 italic shadow-sm">
                  <span className="font-bold not-italic text-[9px] uppercase text-emerald-600 dark:text-emerald-400 block mb-0.5">
                    Analisis Alasan Kepuasan:
                  </span>
                  "{customerScore.kepuasan_customer_alasan}"
                </div>
              )}
            </div>

            {/* 2. Tingkat Pemahaman Customer -> Teal / Toska Teal */}
            <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-slate-700 dark:text-slate-300">
                  🧠 Tingkat Pemahaman Customer
                </span>
                <span className="text-orange-600 dark:text-orange-400 font-bold">
                  {customerScore.pemahaman_customer || 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                <div
                  className="bg-orange-500 dark:bg-orange-400 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${parseInt(customerScore.pemahaman_customer || 0, 10)}%`,
                  }}
                ></div>
              </div>
              {customerScore.pemahaman_customer_alasan && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/90 p-2 rounded-lg border border-slate-800 mt-1">
                  "{customerScore.pemahaman_customer_alasan}"
                </p>
              )}
            </div>

            {/* 3. Efektivitas Penyampaian Masalah -> Sky Blue / Biru Langit */}
            <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-slate-700 dark:text-slate-300">
                  🗣️ Efektivitas Penyampaian Masalah
                </span>
                <span className="text-sky-600 dark:text-sky-400 font-bold">
                  {customerScore.penyampaian_customer || 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                <div
                  className="bg-Blue-500 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${parseInt(customerScore.penyampaian_customer || 0, 10)}%`,
                  }}
                ></div>
              </div>
              {customerScore.penyampaian_customer_alasan && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-800 mt-1">
                  "{customerScore.penyampaian_customer_alasan}"
                </p>
              )}
            </div>

            {/* 4. Tingkat Kemarahan / Frustrasi -> Amber Orange ke Crimson Red */}
            <div className="p-3.5 border border-red-100 dark:border-red-900/20 rounded-xl bg-white dark:bg-slate-900 shadow-sm space-y-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-slate-700 dark:text-slate-300">
                  🔥 Tingkat Kemarahan / Frustrasi
                </span>
                <span className="text-red-600 dark:text-red-400 font-bold">
                  {customerScore.marah || 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                <div
                  className="bg-red-500 dark:bg-red-400 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${parseInt(customerScore.marah || 0, 10)}%`,
                  }}
                ></div>
              </div>
              {customerScore.marah_alasan && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-red-50/10 dark:bg-red-950/5 p-2 rounded-lg border border-red-300/50 mt-1">
                  "{customerScore.marah_alasan}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: DETEKSI ANCAMAN */}
        {activeTab === "ancaman" && (
          <div className="space-y-3 text-xs">
            <div className="bg-red-50/20 dark:bg-red-950/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20 space-y-3">
              <h3 className="font-bold text-red-700 dark:text-red-400 uppercase tracking-wide text-[11px] flex items-center gap-1">
                ⚠️ Alert: Indikasi Resiko & Ancaman
              </h3>
              {Object.keys(ancaman).map((key) => (
                <div
                  key={key}
                  className="border-b border-red-100/50 dark:border-red-900/10 pb-2.5 last:border-none last:pb-0"
                >
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-0.5">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`text-xs ${String(ancaman[key]).toLowerCase() === "ya" || String(ancaman[key]).toLowerCase() === "true" ? "text-red-600 font-bold" : "text-slate-700 dark:text-slate-300"}`}
                  >
                    {String(ancaman[key])}
                  </span>
                </div>
              ))}
              {Object.keys(ancaman).length === 0 && (
                <p className="text-slate-400 italic">
                  Aman. Tidak terdeteksi adanya ancaman.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Jika di HP, kita render langsung tanpa pembungkus Draggable
  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none ${isMobile ? "bg-black/50 pointer-events-auto" : "grid place-items-center"}`}
    >
      {isMobile ? (
        <>
          <div className="absolute inset-0" onClick={onClose}></div>
          {renderContent()}
        </>
      ) : (
        <Draggable nodeRef={nodeRef} handle=".drag-header" cancel=".no-drag">
          {renderContent()}
        </Draggable>
      )}
    </div>
  );
}
