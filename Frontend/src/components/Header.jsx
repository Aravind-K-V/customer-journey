import React, { useEffect, useState } from "react";
import { Bell, Settings } from "lucide-react";

export default function Header() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  return (
    <div className="mx-4 mt-3 mb-2">
      <header className="bg-[#0D1B4C] w-full h-[62px] mx-auto flex items-center justify-between text-white px-8 rounded-xl">
        {/* Left: Logo + Company Name */}
        <div className="flex items-center space-x-3 ml-2">
          <img src="/assets/logo.svg" alt="Logo" className="h-[25px]" />
          <span className="text-xl font-semibold select-none">Kazunov1AI</span>
        </div>

        {/* Spacer */}
        <div className="w-[138px]" />

        {/* Right: Icons + Profile + Logout */}
        <div className="flex items-center space-x-6">
          <Bell className="w-[20px] h-[20px] cursor-pointer" />
          <Settings className="w-[20px] h-[20px] cursor-pointer" />
          <div className="flex items-center space-x-2 select-none">
            <img
              src="/assets/profilepic.webp"
              alt="Profile"
              className="w-[35px] h-[35px] rounded-full"
            />
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium">{username || "User"}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
          <button
            className="bg-blue-600 px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold"
            onClick={() => {
              localStorage.clear();  // optional logout logic
              window.location.href = "/"; // redirect to login
            }}
          >
            LOG OUT
          </button>
        </div>
      </header>
    </div>
  );
}