import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RightSectionregister = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post("http://13.202.6.228:8000/api/auth/register", {
        name,
        email,
        password,
      });

      if (response.data.success) {
        localStorage.setItem("userEmail", email);
        setSuccessMsg("Registration successful! Redirecting...");
        setTimeout(() => navigate("/"), 1500);
      } else {
        setErrorMsg(response.data.message || "Registration failed");
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Server error");
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center px-10 py-12 bg-transparent">
      <div className="w-[561px] flex flex-col items-start gap-4">
        <h2 className="text-[35px] text-[#0F012A] font-medium">Register on Kazunov 1AI</h2>

        <div className="w-full">
          <label className="text-sm">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-[45px] px-3 border rounded"
          />
        </div>

        <div className="w-full">
          <label className="text-sm">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-[45px] px-3 border rounded"
          />
        </div>

        <div className="w-full">
          <label className="text-sm">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-[45px] px-3 border rounded"
          />
        </div>

        <div className="w-full">
          <label className="text-sm">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-[45px] px-3 border rounded"
          />
        </div>

        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
        {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

        <div className="w-full flex justify-end">
          <button
            onClick={handleRegister}
            className="w-[111px] h-[45px] bg-[#71A6FE] text-white rounded"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightSectionregister;