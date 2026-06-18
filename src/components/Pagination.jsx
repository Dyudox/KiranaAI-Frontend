import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  data = [],
  totalItems: serverTotalItems, // 🌟 TAMBAHAN: Tangkap prop totalItems dari backend
  currentPage = 1,
  setCurrentPage,
  itemsPerPage = 10,
  setItemsPerPage,
  setPerPage,
  setLimit,
}) => {
  const safeData = Array.isArray(data) ? data : [];

  // 🌟 TAMBAHAN LOGIKA HYBRID:
  // Jika serverTotalItems ada, pakai itu. Jika tidak (menu lama), pakai safeData.length.
  const totalItems =
    serverTotalItems !== undefined ? serverTotalItems : safeData.length;

  const safeItemsPerPage = Number(itemsPerPage) || 10;
  const totalPages = Math.ceil(totalItems / safeItemsPerPage) || 1;

  const safeCurrentPage = Number(currentPage) || 1;
  const indexOfLastItem = safeCurrentPage * safeItemsPerPage;
  const indexOfFirstItem = indexOfLastItem - safeItemsPerPage;

  // KUNCI PERBAIKAN: Fungsi ini sekarang menerima 'value' langsung berupa string murni, bukan event (e)
  const handlePageSizeChange = (rawValue) => {
    const val = Number(rawValue);
    if (typeof setItemsPerPage === "function") setItemsPerPage(val);
    else if (typeof setPerPage === "function") setPerPage(val);
    else if (typeof setLimit === "function") setLimit(val);

    if (typeof setCurrentPage === "function") setCurrentPage(1);
  };

  if (totalItems === 0) return null;

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700/60 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-zinc-800/30 w-full">
      {/* ================= PAGINATION CONTROLS ================= */}

      {/* Sisi Kiri: Selector Jumlah Baris Menggunakan Shadcn UI */}
      <div className="flex items-center gap-3 order-2 md:order-1 w-full md:w-auto justify-start">
        <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
          Page Size
        </span>

        {/* Menggunakan komponen Select kustom Anda */}
        <Select
          value={String(safeItemsPerPage)}
          onValueChange={handlePageSizeChange}
        >
          {/* KUNCI PERBAIKAN: Menambahkan text-gray-900 (light) dan dark:text-gray-100 (dark) */}
          <SelectTrigger className="w-[110px] h-8 bg-background border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer">
            <SelectValue placeholder={`${safeItemsPerPage} baris`} />
          </SelectTrigger>

          <SelectContent className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
            {[5, 10, 25, 50, 100].map((val) => (
              <SelectItem
                key={val}
                value={String(val)}
                className="text-xs font-medium cursor-pointer focus:bg-orange-100 dark:focus:bg-orange-800 focus:text-orange-900 dark:focus:text-orange-100"
              >
                {val} baris
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sisi Kanan: Navigasi Halaman */}
      <div className="flex items-center justify-between md:justify-end gap-3 order-1 md:order-3 w-full md:w-auto">
        <p className="text-[11px] text-muted-foreground font-bold tracking-wider uppercase whitespace-nowrap">
          Page{" "}
          <span className="text-foreground">
            {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)}
          </span>{" "}
          of <span className="text-foreground">{totalItems}</span> items
        </p>

        {/* AREA SCROLL TOMBOL */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-[180px] sm:max-w-[300px] md:max-w-none py-1">
          {/* Tombol Previous */}
          <button
            onClick={() =>
              typeof setCurrentPage === "function" &&
              setCurrentPage((prev) => Math.max(prev - 1, 1))
            }
            disabled={safeCurrentPage === 1}
            className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-background text-foreground hover:bg-muted font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Deretan Angka Halaman */}
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;

              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= safeCurrentPage - 1 &&
                  pageNum <= safeCurrentPage + 1)
              ) {
                const isActive = safeCurrentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() =>
                      typeof setCurrentPage === "function" &&
                      setCurrentPage(pageNum)
                    }
                    className={`h-8 min-w-[32px] px-2 shrink-0 inline-flex items-center justify-center rounded-lg text-xs font-bold transition-all border ${
                      isActive
                        ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                        : "bg-background text-foreground border-gray-200 dark:border-gray-800 hover:bg-muted"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                pageNum === safeCurrentPage - 2 ||
                pageNum === safeCurrentPage + 2
              ) {
                return (
                  <span
                    key={pageNum}
                    className="text-muted-foreground/50 px-0.5 self-center select-none shrink-0"
                  >
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          {/* Tombol Next */}
          <button
            onClick={() =>
              typeof setCurrentPage === "function" &&
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={safeCurrentPage === totalPages}
            className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-background text-foreground hover:bg-muted font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
