import React from "react";
import { Bell, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function LoginHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const onRegister = location.pathname === "/register";

  return (
    <div className="mx-4 mt-3 mb-2">
      <header className="bg-[#0D1B4C] w-full h-[62px] flex items-center justify-between px-8 rounded-xl text-white shadow-sm">
        <div className="flex items-center space-x-3 ml-2">
          <img src="/assets/logo.svg" alt="Logo" className="h-[25px]" />
          <span className="text-xl font-semibold">Kazunov1AI</span>
        </div>

        <div className="flex items-center gap-6">
          <Bell className="w-5 h-5 cursor-pointer" />
          <Settings className="w-5 h-5 cursor-pointer" />
          <button
            className="bg-[#1F65FF] hover:bg-[#1349b4] px-5 py-[6px] rounded text-sm font-semibold"
            onClick={() => navigate(onRegister ? "/" : "/register")}
          >
            {onRegister ? "Login" : "Register"}
          </button>
        </div>
      </header>
    </div>
  );
}