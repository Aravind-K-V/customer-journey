import React, { useState, useEffect } from 'react';

const STPReject = () => {
  const [showRejectedScreen, setShowRejectedScreen] = useState(true);
  let called = false;

  useEffect(() => {
    const approveProposal = async () => {
      if (called) return; // prevent double call in dev
      called = true;
      try {
        const { proposerId, proposalNumber, first_member } = JSON.parse(sessionStorage.getItem("navigationState"));

        if (!proposerId || !proposalNumber) {
          console.warn("⚠️ proposerId or proposalNumber missing in sessionStorage");
          return;
        }

        const response = await fetch("http://13.202.6.228:8000/reject-proposal", {
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

      {/* White Card Box */}
      <div className="bg-white shadow-md rounded-md p-3 mt-3 min-h-[300px] flex flex-col items-center justify-center">

        {/* REJECTED SCREEN */}
        {showRejectedScreen && (
          <div className="flex flex-col items-center mt-[-60px] text-center transition-opacity p-6">
            <img src="/assets/rejected.svg" alt="Rejected" className="w-60 h-60" style={{ marginBottom: "-40px" }} />
            <div className="flex items-center gap-1">
              <h2 className="text-xl font-semibold text-[#0F012A]">Your Application Has Been Rejected</h2>
              <img src="/assets/circle-question.svg" alt="Help" className="w-4 h-4" />
            </div>
            <p className="text-[#534B68] text-sm mt-1 mb-4 max-w-md">
              Your application has been rejected. Upload the Correct Document Again and Get Approved.
            </p>
            <button className="flex items-center gap-1 border border-[#3371F2] text-[#3371F2] text-sm px-4 py-1.5 rounded">
              <img src="/assets/help.svg" className="w-4 h-4" alt="Help" />
              Want Us To Consider? Get In Touch
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default STPReject;