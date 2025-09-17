import React, { useState } from 'react';
import { useEffect } from 'react';

const STPAccept = () => {
  const [showPaymentPortal, setShowPaymentPortal] = useState(false);

  useEffect(() => {
    let called = false;

    const approveProposal = async () => {
      if (called) return; // prevent double call in dev
      called = true;
      try {
        const { proposerId, proposalNumber, first_member } = JSON.parse(sessionStorage.getItem("navigationState"));

        if (!proposerId || !proposalNumber) {
          console.warn("⚠️ proposerId or proposalNumber missing in sessionStorage");
          return;
        }

        const response = await fetch("http://13.202.6.228:8000/approve-proposal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposerId, proposalNumber }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log("✅ Proposal approved:", data.proposal);
        } else {
          console.error("❌ Failed to approve proposal:", data.error);
        }
      } catch (err) {
        console.error("❌ Error calling approveProposal API:", err);
      }
    };

    approveProposal(); // Automatically runs when component mounts
  }, []);

  return (
    <div className="w-full h-full overflow-auto p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-[#0F012A] font-medium text-xl">Welcome to Kazunov 1AI</h1>
        <p className="text-[#534B68] text-sm">Your one-stop insurance underwriting provider</p>
      </div>

      {/* White Card */}
      <div className="bg-white shadow-md rounded-md p-3 mt-3 min-h-[200px] flex flex-col items-center justify-center relative">

        {/* APPROVED SCREEN (Always visible) */}
        <div className="flex flex-col items-center mt-[-60px] text-center transition-opacity duration-300">
          <img src="/assets/approved.svg" alt="Approved" className="w-60 h-60 block" style={{ marginBottom: "-60px" }} />
          <div className="flex items-center gap-2 mt-4">
            <h2 className="text-2xl font-semibold text-[#0F012A]">Your Application is Approved</h2>
            <img src="/assets/circle-question.svg" alt="Help" className="w-5 h-5" />
          </div>
          <p className="text-[#534B68] text-sm mt-2 max-w-md">
            Your application has been approved! Just one more step—proceed to the payment portal to finalize everything.
          </p>
          <button
            className="mt-4 px-4 py-2 bg-[#3371F2] text-white rounded-md text-sm font-medium"
            onClick={() => setShowPaymentPortal(true)}
          >
            Proceed
          </button>
        </div>

        {/* PAYMENT PORTAL SCREEN (overlays on top) */}
        {showPaymentPortal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-0 flex flex-col items-center gap-2 max-w-[380px] w-full">
              <div className="flex flex-col items-center mb-8 gap-0 mt-[-70px]">
                <img src="/assets/portal.svg" alt="Portal" className="w-64 h-75 block" style={{ marginBottom: "-80px" }} />
                <div className="flex items-center gap-0">
                  <h2 className="text-2xl font-semibold text-[#0F012A]">Proceed to Payment Portal</h2>
                </div>
                <p className="text-[#534B68] text-sm text-center max-w-xs mt-2">
                  You're almost there! Just head over to the payment portal to finish up.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default STPAccept;