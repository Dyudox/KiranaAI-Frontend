import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Save,
  Loader2,
  Bot,
  Sliders,
  MessageSquareText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("ai-core");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State untuk menampung config dari DB
  const [configs, setConfigs] = useState({
    system_prompt: "",
  });

  // Fetch data konfigurasi saat komponen dimuat
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/ai-config");
      if (response.data.success) {
        setConfigs({
          system_prompt: response.data.data.system_prompt || "",
        });
      }
    } catch (error) {
      console.error("Gagal mengambil config:", error);
      toast.error("Gagal memuat konfigurasi dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await axios.put("/api/ai-config", { configs });
      if (response.data.success) {
        toast.success("Konfigurasi KiranaAI berhasil diperbarui!");
      }
    } catch (error) {
      console.error("Gagal menyimpan config:", error);
      toast.error("Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kelola konfigurasi mesin AI Kirana dan penyesuaian instruksi dasar WMS
          KiranaAI.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab("ai-core")}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === "ai-core"
              ? "border-orange-500 text-orange-600 dark:text-orange-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Bot className="w-4 h-4" />
          AI Core Instruction
        </button>
        <button
          onClick={() => setActiveTab("ai-meta")}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all ${
            activeTab === "ai-meta"
              ? "border-orange-500 text-orange-600 dark:text-orange-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Model Parameters
        </button>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Utama (Kiri & Tengah) */}
          <div className="md:col-span-2 space-y-6">
            {activeTab === "ai-core" && (
              <form
                onSubmit={handleSave}
                className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-slate-200 dark:border-zinc-900 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <MessageSquareText className="w-4 h-4 text-orange-500" />
                  Knowledge Base Persona & Extraction Instruction
                </div>

                <p className="text-xs text-slate-400">
                  Instruksi ini mengatur bagaimana Kirana AI bertindak sebagai
                  analis dokumen. Mengontrol perilaku LLM dalam membaca context
                  chunks hasil Vector Search dari file PDF/Excel.
                </p>

                <textarea
                  value={configs.system_prompt}
                  onChange={(e) =>
                    setConfigs({ ...configs, system_prompt: e.target.value })
                  }
                  rows={8}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none font-mono leading-relaxed"
                  placeholder="Masukkan instruksi ekstraksi knowledge base di sini..."
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 h-10 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            )}

            {activeTab === "ai-meta" && (
              <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-slate-200 dark:border-zinc-900 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Sliders className="w-4 h-4 text-orange-500" />
                  Ollama Engine Configuration
                </div>
                <p className="text-xs text-slate-400">
                  Parameter statis backend saat ini yang terhubung ke Ollama
                  local server.
                </p>

                <div className="space-y-3 pt-2 text-sm">
                  <div className="flex justify-between border-b border-slate-100 dark:border-zinc-900 pb-2">
                    <span className="text-slate-400">Active LLM Model</span>
                    <span className="font-mono bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded text-xs font-bold text-orange-600 dark:text-orange-400">
                      qwen2.5:1.5b
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-zinc-900 pb-2">
                    <span className="text-slate-400">Temperature</span>
                    <span className="font-mono text-xs">
                      0.2 (Strict & Factual)
                    </span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-400">Max Predict Tokens</span>
                    <span className="font-mono text-xs">500 tokens</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel Informasi Ringkas (Kanan) */}
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 text-sm font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Knowledge Refinement Info
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
                Sistem instruksi di samping secara otomatis dikombinasikan
                dengan{" "}
                <strong>
                  6 potongan konteks teratas (Vector Search Chunks)
                </strong>{" "}
                dari file PDF/Excel regulasi dan masukan koreksi dari user
                (chat_feedback).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
