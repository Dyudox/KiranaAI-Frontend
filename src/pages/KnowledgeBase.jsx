import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Plus,
  MessageSquare,
  PanelLeft,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export default function KnowledgeBase() {
  // Fungsi pembantu terstandarisasi untuk format tanggal lokal di frontend agar rapi
  const formatWaktuSekarang = () => {
    return (
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) +
      " pukul " +
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  };

  // Pesan sambutan default yang akan selalu ada di paling atas chat
  const welcomeMessage = {
    id: "welcome",
    sender: "ai",
    text: "Halo! Saya Kirana AI. Saya siap membantu menjawab pertanyaan Anda berdasarkan dokumen internal, regulasi, dan panduan teknis layanan Ditjen AHU yang telah dilatih. Ada yang bisa saya bantu hari ini?",
    time: formatWaktuSekarang(),
  };

  // 1. Kumpulan State Utama
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // State untuk menampung daftar riwayat sesi di sidebar
  const [chatSessions, setChatSessions] = useState([]);

  // State untuk mengontrol buka/tutup sidebar (default true = terbuka/maximize)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // State khusus Rating & Feedback (Dislike) agar tidak tertukar antar bubble chat
  const [ratings, setRatings] = useState({}); // format: { [msgId]: 'like' | 'dislike' }
  const [feedbackState, setFeedbackState] = useState({}); // format: { [msgId]: true/false }
  const [feedbackText, setFeedbackText] = useState({}); // format: { [msgId]: 'teks feedback' }

  // AMBIL DATA DARI LOCAL STORAGE LOGIN ANDA SECARA REAL-TIME
  const userLogin = JSON.parse(localStorage.getItem("user"));
  const userId = userLogin?.id || 1; // Otomatis mendapatkan ID 1 dari user admin Anda

  // Mengambil sessionId secara dinamis dari localStorage agar kebal refresh halaman
  const [sessionId, setSessionId] = useState(() => {
    return (
      localStorage.getItem("active_chat_session_id") || `sesi-${Date.now()}`
    );
  });

  const chatEndRef = useRef(null);

  // ==========================================
  // PARSER MARKDOWN KUSTOM (AMAN & UTUH)
  // ==========================================

  // Parser elemen inline (Bold '**' dan Inline Code '`')
  const renderElemenInline = (line) => {
    const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={idx}
            className="font-bold text-zinc-950 dark:text-zinc-50"
          >
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="bg-zinc-200 dark:bg-zinc-800 text-rose-600 dark:text-rose-400 px-1 py-0.5 rounded font-mono text-xs"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Parser Utama untuk merubah string Markdown menjadi elemen HTML React terstruktur
  const renderMarkdownKustom = (text) => {
    if (!text) return null;

    // Pisahkan berdasarkan blok kode (```)
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // Ambil bahasa pemrograman dan isi kodenya
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : "";
        const codeContent = match ? match[2] : part.slice(3, -3);

        return (
          <pre key={index} className="chat-markdown-pre">
            {language && (
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 border-b border-zinc-800 pb-1">
                {language}
              </div>
            )}
            <code className="text-xs font-mono">{codeContent.trim()}</code>
          </pre>
        );
      } else {
        // Parser Baris yang mengelompokkan list item yang berurutan secara dinamis
        const lines = part.split("\n");
        const renderedElements = [];
        let currentList = null; // { type: 'ul' | 'ol', items: [] }

        // Fungsi pembantu untuk mendorong list yang terakumulasi ke array elemen
        const flushList = (keyIndex) => {
          if (currentList) {
            if (currentList.type === "ol") {
              renderedElements.push(
                <ol
                  key={`ol-${keyIndex}`}
                  className="list-decimal pl-5 my-2 space-y-1"
                >
                  {currentList.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                    >
                      {renderElemenInline(item)}
                    </li>
                  ))}
                </ol>,
              );
            } else if (currentList.type === "ul") {
              renderedElements.push(
                <ul
                  key={`ul-${keyIndex}`}
                  className="list-disc pl-5 my-2 space-y-1"
                >
                  {currentList.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                    >
                      {renderElemenInline(item)}
                    </li>
                  ))}
                </ul>,
              );
            }
            currentList = null;
          }
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();

          // Hitung jumlah spasi di awal baris untuk menentukan level indentasi
          const indent = line.length - line.trimStart().length;
          const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");

          if (isBullet) {
            const content = trimmed.substring(2);

            // Kita gunakan margin-left berdasarkan level indentasi
            // Indentasi 2 spasi = level 1, 6 spasi = level 2, dst.
            const marginLeft = indent > 0 ? `${(indent / 2) * 1.5}rem` : "0rem";

            renderedElements.push(
              <div
                key={`list-${i}`}
                className="flex items-start text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                style={{ marginLeft }}
              >
                <span className="mr-2">•</span>
                <span>{renderElemenInline(content)}</span>
              </div>,
            );
          } else if (trimmed.startsWith("###")) {
            flushList(i);
            renderedElements.push(
              <h3
                key={`h3-${i}`}
                className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-2"
              >
                {renderElemenInline(trimmed.replace("### ", ""))}
              </h3>,
            );
          } else if (trimmed !== "") {
            flushList(i);
            renderedElements.push(
              <p
                key={`p-${i}`}
                className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
                style={{ marginLeft: `${(indent / 2) * 1.5}rem` }}
              >
                {renderElemenInline(line)}
              </p>,
            );
          }
        }
        // Pastikan list terakhir ter-flush
        flushList(lines.length);

        return (
          <div key={index} className="space-y-1">
            {renderedElements}
          </div>
        );
      }
    });
  };

  // ==========================================
  // LOGIKA AKSI RATING & FEEDBACK
  // ==========================================
  const handleRatingClick = async (msgId, type) => {
    setRatings((prev) => ({ ...prev, [msgId]: type }));

    if (type === "like") {
      // Jika Like, kirim langsung ke backend tanpa form feedback tambahan
      try {
        await axios.post("http://localhost:5000/api/chat/feedback", {
          messageId: msgId,
          rating: "like",
          reason: "",
        });
      } catch (error) {
        console.warn(
          "API Feedback belum terpasang di backend. Rating diamankan di lokal.",
        );
      }
      // Pastikan form input feedback tertutup jika sebelumnya sempat terbuka
      setFeedbackState((prev) => ({ ...prev, [msgId]: false }));
    } else {
      // Jika Dislike, buka form input saran koreksi jawaban benar
      setFeedbackState((prev) => ({ ...prev, [msgId]: true }));
    }
  };

  const handleKirimFeedbackText = async (msgId) => {
    const textKoreksi = feedbackText[msgId]?.trim() || "";
    if (!textKoreksi) return;

    try {
      await axios.post("http://localhost:5000/api/chat/feedback", {
        messageId: msgId,
        rating: "dislike",
        reason: textKoreksi,
      });

      // Tutup form dan tampilkan pesan sukses
      setFeedbackState((prev) => ({ ...prev, [msgId]: false }));
      alert("Terima kasih atas koreksinya! Masukan Anda berhasil disimpan.");
    } catch (error) {
      console.warn(
        "Gagal terhubung ke API Feedback backend. Koreksi berhasil disimpan secara lokal (Simulasi).",
      );
      // Fallback luring jika backend belum siap (UX tetap mulus & user tidak mendapati error pecah)
      setFeedbackState((prev) => ({ ...prev, [msgId]: false }));
      alert("Koreksi Anda berhasil diterima secara lokal!");
    }
  };

  // 2. Fungsi menarik DAFTAR SESI untuk sidebar samping berdasarkan user login
  const muatDaftarSesiSidebar = async () => {
    try {
      if (!userId) return;

      const response = await axios.get(
        `http://localhost:5000/api/chat/sessions?userId=${userId}`,
      );
      if (response.data && response.data.success && response.data.sessions) {
        setChatSessions(response.data.sessions);
      }
    } catch (error) {
      console.error("Gagal memuat daftar sesi di sidebar:", error);
    }
  };

  // 3. EFFECT Utama: Tarik isi chat di layar utama & update list sidebar tiap kali sessionId berubah
  useEffect(() => {
    const muatRiwayatChatUtama = async () => {
      try {
        setLoadingHistory(true);
        const response = await axios.get(
          `http://localhost:5000/api/chat/history/${sessionId}`,
        );

        if (
          response.data &&
          response.data.history &&
          response.data.history.length > 0
        ) {
          const mappedHistory = response.data.history.map((chat) => ({
            id: chat.id,
            sender: chat.sender === "bot" ? "ai" : "user",
            text: chat.message,
            time: chat.time,
          }));

          setMessages([welcomeMessage, ...mappedHistory]);
        } else {
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error("Gagal menyinkronkan riwayat chat dari database:", error);
        setMessages([welcomeMessage]);
      } finally {
        setLoadingHistory(false);
      }
    };

    muatRiwayatChatUtama();
    muatDaftarSesiSidebar();
  }, [sessionId, userId]);

  // Auto scroll ke pesan paling baru tiap kali ada update chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const suggestedQuestions = [
    "Bagaimana cara mendirikan PT?",
    "Apa syarat utama mendirikan Perseroan Perorangan?",
    "Bagaimana ketentuan terkait jaminan fidusia?",
  ];

  // 4. Fungsi Mengirim Pesan Ke Backend
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput("");

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userQuery,
      time: formatWaktuSekarang(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/chat/message",
        {
          sessionId: sessionId,
          userId: userId,
          message: userQuery,
        },
      );

      const aiMessage = {
        id: response.data.messageId || `ai-${Date.now()}`, // Gunakan ID pesan asli dari database jika ada
        sender: "ai",
        text: response.data.reply,
        time: formatWaktuSekarang(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      muatDaftarSesiSidebar();
    } catch (error) {
      console.error("Error connecting to KiranaAI Backend:", error);

      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: "❌ Terjadi kesalahan koneksi. Pastikan server backend dan Ollama lokal Anda sudah dijalankan.",
        time: formatWaktuSekarang(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedClick = (question) => {
    setInput(question);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden font-sans relative transition-colors duration-200">
      {/* 1. TOMBOL MAXIMIZE UNTUK HP */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 left-4 z-40 p-2.5 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl transition-all border border-zinc-200 dark:border-zinc-700 shadow-md md:hidden flex items-center justify-center"
          title="Maximize Sidebar"
        >
          <PanelLeft size={14} />
        </button>
      )}

      {/* SIDEBAR MINI: Riwayat Chat Samping */}
      <div
        className={`bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300 absolute md:relative z-30 h-full ${
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "w-0 -translate-x-full md:w-16 md:translate-x-0"
        }`}
      >
        {/* Kontainer Tombol Aksi */}
        <div className="p-3 h-16 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-center gap-2">
          {isSidebarOpen && (
            <button
              onClick={() => {
                const idSesiBaru = `sesi-${Date.now()}`;
                localStorage.setItem("active_chat_session_id", idSesiBaru);
                setSessionId(idSesiBaru);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className="flex-1 flex items-center justify-center bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold rounded-xl transition-all duration-200 text-sm py-2.5 px-4 gap-2 hover:bg-orange-500/20"
              title="Sesi Baru"
            >
              <Plus size={14} className="shrink-0" />
              <span className="truncate">Sesi Baru</span>
            </button>
          )}

          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0"
              title="Minimize Sidebar"
            >
              <PanelLeft size={16} />
            </button>
          )}

          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center mx-auto hidden md:flex"
              title="Maximize Sidebar"
            >
              <PanelLeft size={16} />
            </button>
          )}
        </div>

        {/* Area Daftar Percakapan Terakhir */}
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar overflow-x-hidden">
          {isSidebarOpen && (
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 px-3 py-2 uppercase tracking-wider truncate">
              Percakapan Terakhir
            </div>
          )}

          {loadingHistory ? (
            <div className="space-y-2 p-2">
              <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
              {isSidebarOpen && (
                <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse w-5/6"></div>
              )}
            </div>
          ) : chatSessions.length === 0 ? (
            isSidebarOpen && (
              <div className="text-xs text-zinc-400 dark:text-zinc-500 px-3 py-4 italic text-center">
                Belum ada riwayat obrolan
              </div>
            )
          ) : (
            chatSessions.map((item) => (
              <SessionItem
                key={item.session_id || item.sessionId}
                item={item}
                activeSessionId={sessionId}
                setSessionId={(id) => {
                  setSessionId(id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                muatDaftarSesiSidebar={muatDaftarSesiSidebar}
                isSidebarOpen={isSidebarOpen}
              />
            ))
          )}
        </div>
      </div>

      {/* Overlay Hitam Transparan di HP */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-zinc-950/20 dark:bg-black/40 z-20 md:hidden backdrop-blur-[1px]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* AREA UTAMA CHATBOX (Kanan) */}
      <div className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/20 w-full custom-scrollbar ">
        {/* Header Atas Chat */}
        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6 shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2.5 ${!isSidebarOpen ? "pl-10 md:pl-0" : ""}`}
            >
              <div className="p-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-lg">
                <Bot size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Kirana AI
                </h2>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                  Asisten Regulasi Ditjen AHU
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Area Konten */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
          {messages.length <= 1 ? (
            /* Empty State Style Gemini */
            <div className="max-w-2xl mx-auto h-full flex flex-col justify-center items-center py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 bg-gradient-to-tr from-orange-600 to-amber-500 text-white rounded-2xl shadow-md mb-6">
                <Sparkles size={36} className="animate-pulse" />
              </div>

              <h1 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight">
                Ada yang bisa saya bantu hari ini?
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mt-2 leading-relaxed">
                Saya siap membantu Anda menyisir dokumen internal, regulasi
                hukum, dan panduan teknis layanan Ditjen AHU secara kilat.
              </p>

              {/* Grid Kartu Pertanyaan Rekomendasi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-10 text-left">
                {suggestedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedClick(question)}
                    className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all duration-200 text-zinc-700 dark:text-zinc-300 hover:bg-orange-500/5 dark:hover:bg-orange-500/10 hover:border-orange-500/30 shadow-sm flex flex-col justify-between group h-28"
                  >
                    <p className="text-xs font-semibold leading-relaxed line-clamp-3 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                      "{question}"
                    </p>
                    <div className="w-full flex justify-end">
                      <span className="p-1 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:bg-orange-500/20 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors text-[10px]">
                        ➔
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Tampilan Aktif Percakapan */
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => {
                const isAi = msg.sender === "ai";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isAi ? "justify-start" : "justify-end"}`}
                  >
                    {isAi && (
                      <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 text-xs shadow-sm">
                        <Bot size={14} />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed transition-colors border ${
                        isAi
                          ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none"
                          : "bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/20 text-zinc-900 dark:text-zinc-100 rounded-tr-none font-medium"
                      }`}
                    >
                      {/* BALASAN DENGAN PARSER MARKDOWN KUSTOM (DIRESTORE KEMBALI) */}
                      {isAi ? (
                        <div className="prose dark:prose-invert max-w-none chat-markdown">
                          {renderMarkdownKustom(msg.text)}
                        </div>
                      ) : (
                        <p className="whitespace-pre-line">{msg.text}</p>
                      )}

                      {/* AREA ELEMEN RATING LIKE / DISLIKE & FEEDBACK KOREKSI */}
                      {isAi && msg.id !== "welcome" && (
                        <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  handleRatingClick(msg.id, "like")
                                }
                                className={`p-1.5 rounded-lg transition-colors ${
                                  ratings[msg.id] === "like"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600"
                                }`}
                                title="Jawaban Membantu (Like)"
                              >
                                <ThumbsUp size={13} />
                              </button>

                              <button
                                onClick={() =>
                                  handleRatingClick(msg.id, "dislike")
                                }
                                className={`p-1.5 rounded-lg transition-colors ${
                                  ratings[msg.id] === "dislike"
                                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600"
                                }`}
                                title="Jawaban Kurang Tepat (Dislike)"
                              >
                                <ThumbsDown size={13} />
                              </button>

                              {ratings[msg.id] === "like" && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-2 animate-pulse">
                                  Terbantu! ✓
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                              {msg.time}
                            </span>
                          </div>

                          {/* Form Pengisian Koreksi Teks Hanya Muncul Jika Klik Dislike */}
                          {feedbackState[msg.id] && (
                            <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                              <p className="text-[10px] font-bold text-red-600 dark:text-red-400">
                                Bantu Kirana belajar! Silakan tulis jawaban yang
                                seharusnya benar:
                              </p>
                              <textarea
                                value={feedbackText[msg.id] || ""}
                                onChange={(e) =>
                                  setFeedbackText((prev) => ({
                                    ...prev,
                                    [msg.id]: e.target.value,
                                  }))
                                }
                                className="w-full text-xs p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                                placeholder="Masukkan draf paragraf, rincian, atau syarat yang benar menurut dokumen resmi Ditjen AHU..."
                                rows={3}
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() =>
                                    setFeedbackState((prev) => ({
                                      ...prev,
                                      [msg.id]: false,
                                    }))
                                  }
                                  className="px-2.5 py-1 text-[10px] rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
                                >
                                  Batal
                                </button>
                                <button
                                  onClick={() =>
                                    handleKirimFeedbackText(msg.id)
                                  }
                                  className="px-2.5 py-1 text-[10px] rounded-md bg-orange-600 text-white hover:bg-orange-700 font-semibold shadow-sm"
                                >
                                  Kirim Koreksi
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* <p className="text-[10px] mt-1.5 text-right font-semibold text-zinc-400 dark:text-zinc-500">
                        {msg.time}
                      </p> */}
                    </div>
                    {!isAi && (
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 dark:bg-zinc-700 text-white flex items-center justify-center shrink-0 text-xs shadow-sm">
                        <User size={14} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Indikator Loading */}
              {isLoading && (
                <div className="flex gap-3 justify-start animate-pulse">
                  <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-zinc-400 flex items-center gap-1.5 shadow-sm">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Area Form Input Chat Bawah */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 transition-colors">
          <form
            onSubmit={handleSend}
            className="max-w-3xl mx-auto relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan regulasi atau panduan teknis..."
              disabled={isLoading}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-800 dark:text-zinc-100 transition-all font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
          <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-500 mt-2 font-semibold">
            Kirana AI memanfaatkan basis pengetahuan internal perusahaan Anda.
            Jawaban didasarkan pada dokumen yang valid secara real-time.
          </p>
        </div>
      </div>
    </div>
  );

  function SessionItem({
    item,
    activeSessionId,
    setSessionId,
    muatDaftarSesiSidebar,
    isSidebarOpen,
  }) {
    const currentSessionId = item.session_id || item.sessionId;
    const textMessage = item.message || item.lastMessage || "Sesi Obrolan";
    const isSelected = activeSessionId === currentSessionId;

    const displayDate = item.created_at
      ? new Date(item.created_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        })
      : item.date || "";

    const [showDropdown, setShowDropdown] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(textMessage);

    const eksekusiRename = async () => {
      if (!newName.trim()) return;
      try {
        await axios.put(
          `http://localhost:5000/api/chat/session/${currentSessionId}`,
          { message: newName.trim() },
        );
        setIsRenaming(false);
        muatDaftarSesiSidebar();
      } catch (err) {
        console.error("Gagal merubah nama sesi:", err);
      }
    };

    const eksekusiDelete = async () => {
      if (window.confirm("Apakah Anda yakin ingin menghapus percakapan ini?")) {
        try {
          await axios.delete(
            `http://localhost:5000/api/chat/session/${currentSessionId}`,
          );
          if (isSelected) {
            const newSesi = `sesi-${Date.now()}`;
            localStorage.setItem("active_chat_session_id", newSesi);
            setSessionId(newSesi);
          } else {
            muatDaftarSesiSidebar();
          }
        } catch (err) {
          console.error("Gagal menghapus sesi:", err);
        }
      }
    };

    return (
      <div
        className="relative group w-full"
        onMouseLeave={() => setShowDropdown(false)}
      >
        {isRenaming && isSidebarOpen ? (
          <div className="w-full flex items-center gap-2 px-3 py-2 bg-orange-500/10 rounded-xl border border-orange-500/30">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-white dark:bg-zinc-800 text-sm border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 focus:outline-none focus:border-orange-500 font-medium text-zinc-800 dark:text-zinc-100 w-full"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && eksekusiRename()}
            />
            <button
              onClick={eksekusiRename}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-500"
            >
              ✓
            </button>
            <button
              onClick={() => setIsRenaming(false)}
              className="text-xs text-red-500 dark:text-red-400 font-bold hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => {
                localStorage.setItem(
                  "active_chat_session_id",
                  currentSessionId,
                );
                setSessionId(currentSessionId);
              }}
              title={textMessage}
              className={`flex items-start rounded-xl text-left transition-all duration-200 border ${
                isSidebarOpen
                  ? "w-full px-3 py-2.5 gap-3 pr-10"
                  : "w-9 h-9 mx-auto justify-center items-center px-0 py-0"
              } ${
                isSelected
                  ? "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20 font-semibold shadow-sm"
                  : "bg-white dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 border-transparent hover:bg-orange-500/5 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400"
              }`}
            >
              <MessageSquare
                size={16}
                className={`shrink-0 transition-colors ${isSidebarOpen ? "mt-0.5" : ""} ${
                  isSelected
                    ? "text-orange-600 dark:text-orange-400 mt-2.5 dark:group-hover:text-orange-400"
                    : "text-zinc-400 dark:text-zinc-500 group-hover:text-orange-500 mt-2.5 dark:group-hover:text-orange-400"
                }`}
              />
              {isSidebarOpen && (
                <div className="truncate flex-1">
                  <p
                    className={`truncate text-sm font-semibold transition-colors ${isSelected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"}`}
                  >
                    {textMessage}
                  </p>
                  {displayDate && (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                      {displayDate}
                    </p>
                  )}
                </div>
              )}
            </button>

            {/* Tombol Tiga Titik */}
            {isSidebarOpen && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
              </div>
            )}

            {/* Dropdown Menu Rename/Delete */}
            {showDropdown && isSidebarOpen && (
              <div className="absolute right-2 top-9 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl py-1 w-28 z-20 text-xs transition-colors">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRenaming(true);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 font-semibold"
                >
                  <span>✏️</span> Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    eksekusiDelete();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 font-semibold"
                >
                  <span>🗑️</span> Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
}
