import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RightSectionForgot = () => {
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post("http://13.202.6.228:8000/api/auth/reset-password", {
        email: resetEmail,
        newPassword,
      });

      if (res.data.success) {
        localStorage.setItem("userEmail", resetEmail);
        setResetSuccess(true);
        setErrorMsg("");
        setTimeout(() => navigate("/"), 2000); // Redirect after success
      } else {
        setErrorMsg(res.data.message || "Reset failed");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Error resetting password");
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-center items-center px-10 py-12 bg-transparent">
      <div className="w-[561px] flex flex-col items-start gap-4">
        <h2 className="text-[35px] text-[#0F012A] font-medium">Reset Password</h2>
        <p className="text-[#534B68] text-[16px]">Enter your registered email to reset password</p>

        <div className="w-full">
          <label className="text-sm">Enter Registered Email</label>
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            className="w-full h-[45px] px-3 border rounded"
          />
        </div>

        <div className="w-full">
          <label className="text-sm">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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

        {resetSuccess && (
          <p className="text-green-600 text-sm">Password updated successfully! Redirecting...</p>
        )}
        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

        <div className="w-full flex justify-between mt-2">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => navigate("/")}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-[#3371F2] text-white rounded"
            onClick={handleResetPassword}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightSectionForgot;