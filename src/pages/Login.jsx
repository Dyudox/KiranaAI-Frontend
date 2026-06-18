import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// import { Moon, Sun } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import logoAhu from "@/assets/Kiero.svg";
import ThemeToggle from "@/components/ThemeToggle";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) throw new Error("Gagal login");
      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // const [isDarkMode, setIsDarkMode] = useState(false);

  // useEffect(() => {
  //   // Cek apakah ada setelan di localStorage
  //   const savedTheme = localStorage.getItem("theme");

  //   // LOGIKA DEFAULT: Jika belum pernah setting, default ke DARK
  //   // Jika savedTheme === 'light', maka light. Jika tidak (null atau 'dark'), maka dark.
  //   const shouldBeDark = savedTheme !== "light";

  //   if (shouldBeDark) {
  //     document.documentElement.classList.add("dark");
  //     setIsDarkMode(true);
  //   } else {
  //     document.documentElement.classList.remove("dark");
  //     setIsDarkMode(false);
  //   }
  // }, []);

  // const toggleTheme = () => {
  //   if (isDarkMode) {
  //     document.documentElement.classList.remove("dark");
  //     localStorage.setItem("theme", "light");
  //     setIsDarkMode(false);
  //   } else {
  //     document.documentElement.classList.add("dark");
  //     localStorage.setItem("theme", "dark");
  //     setIsDarkMode(true);
  //   }
  // };

  return (
    <div className="w-full h-screen flex overflow-hidden font-sans dark:bg-stone-950 transition-colors duration-500">
      <div className="absolute top-4 right-4 z-50">
        {ThemeToggle()}
        {/* <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 transition-colors"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button> */}
      </div>

      {/* Sisi Kiri (Gradient menyesuaikan mode) */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-gradient-to-br from-orange-600 via-amber-700 to-stone-900 dark:from-orange-950 dark:via-stone-900 dark:to-stone-950 p-16 flex-col justify-between text-white relative transition-all duration-500">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-amber-500/20 dark:bg-amber-900/10 rounded-full filter blur-[80px]"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="h-11 px-2.5 rounded-xl bg-amber-900/90  flex items-center justify-center shadow-md">
            <img src={logoAhu} alt="Logo" className="h-8 w-auto" />
          </div>
          <div className="flex flex-col gap-0">
            <h2 className="text-1xl font-extrabold leading-none">
              KIERO TEKNOLOGI
            </h2>
            <span className="text-[12px] font-bold text-orange-200 uppercase">
              KIRANA AI
            </span>
          </div>
          {/* <div>
            <h2 className="text-2xl font-extrabold">KIERO TEKNOLOGI</h2>
            <span className="text-[12px] font-bold text-orange-200 uppercase">
              KIRANA AI
            </span>
          </div> */}
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <h1 className="text-4xl font-bold">Knowledge Base KIERO Teknologi</h1>
          <p className="text-amber-50/80 dark:text-stone-400 font-light">
            Sistem basis pengetahuan terpadu untuk optimalisasi layanan Online.
          </p>
        </div>

        <div className="text-xs text-amber-200/60 dark:text-stone-700">
          &copy; 2026 KIERO Teknologi
        </div>
      </div>

      {/* Sisi Kanan (Form) */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-8 bg-stone-50 dark:bg-stone-950">
        <div className="w-full max-w-md">
          <Card className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl p-8 rounded-2xl">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-2xl font-bold text-stone-900 dark:text-white">
                Sign In
              </CardTitle>
              <CardDescription className="text-stone-500 dark:text-stone-400">
                Masuk ke akun Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {error && <p className="mb-4 text-red-500 text-xs">{error}</p>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-stone-700 dark:text-stone-300">
                    Username
                  </Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 
                                text-stone-900 dark:text-white placeholder:text-stone-400 
                                focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-stone-700 dark:text-stone-300">
                    Password
                  </Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 
                                text-stone-900 dark:text-white placeholder:text-stone-400 
                                focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 rounded-lg"
                  />
                </div>
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-700">
                  {loading ? "Memproses..." : "Masuk ke Akun"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
