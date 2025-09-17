import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RightSectionLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://13.202.6.228:8000/api/auth/login", {
        email,
        password,
      });

      if (response.data.message === 'Login successful') {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('username', response.data.username);

        // Fetch underwriting status
        const statusResponse = await axios.get(`http://13.202.6.228:8000/api/auth/underwriting/status/${email}`);
        const status = statusResponse.data.status;

        localStorage.setItem('underwritingStatus', status);
        const allowedScreens = []
        // Navigate based on status
        switch (status) {
          case 'Request Recieved':
            allowedScreens.push("/Proposal")
            localStorage.setItem('allowedScreens', JSON.stringify(allowedScreens));
            navigate('/Proposal', { replace: true });
            break;
          case 'Approved':
            allowedScreens.push("/STPAccept")
            localStorage.setItem('allowedScreens', JSON.stringify(allowedScreens));

            navigate('/STPAccept', { replace: true });
            break;
          case "Rules Applied": {

            fetch(`http://13.202.6.228:8000/api/ruleEngineRoutes/rule-check?email=${encodeURIComponent(email)}`)
              .then(res => res.json())
              .then(data => {
                // data = { finreview_required: true, mc_required: false, tele_required: true, proposerId, proposalNumber, first_member }

                const allowedScreens = ["/Rules"];
                
                if (data.finreview_required) allowedScreens.push("/FIN");
                if (data.mc_required) allowedScreens.push("/MC");
                if (data.televideoagent_required) allowedScreens.push("/Tele");
                sessionStorage.setItem("ruleEngineData", JSON.stringify(data));
                sessionStorage.setItem("inference", data.rule_status || "N/A");
                localStorage.setItem("allowedScreens", JSON.stringify(allowedScreens));
                console.log(data);
                // also save proposerId, proposalNumber, and first_member in sessionStorage
                const navigationState = {
                  proposerId: data.proposer_id,
                  proposalNumber: data.proposal_number,
                  first_member: data.member_id
                };
                console.log(data)
                sessionStorage.setItem("navigationState", JSON.stringify(navigationState));

                // priority order
                const priority = ["/FIN", "/MC", "/Tele"];
                const nextScreen = priority.find(screen => allowedScreens.includes(screen));

                if (nextScreen) {
                  navigate(nextScreen, { replace: true });
                }
              })
              .catch(err => {
                console.error("Error fetching rule engine data:", err);
              });


            break;
          }
          case 'Rejected':
            allowedScreens.push("/STPReject")
            localStorage.setItem('allowedScreens', JSON.stringify(allowedScreens));

            navigate('/STPReject', { replace: true });
            break;
          case 'Documents Uploaded':
            allowedScreens.push("/UnderReview")
            localStorage.setItem('allowedScreens', JSON.stringify(allowedScreens));

            navigate('/UnderReview', { replace: true }); //needs investigated to be added here
            break;
          case 'Documents Processed':
            allowedScreens.push("/UnderReview")
            localStorage.setItem('allowedScreens', JSON.stringify(allowedScreens));

            navigate('/UnderReview', { replace: true }); //needs investigated to be added here
            break;
          case 'Needs Investigation':
            allowedScreens.push("/UnderReview")
            localStorage.setItem('allowedScreens', JSON.stringify(allowedScreens));

            navigate('/UnderReview', { replace: true }); //needs investigated to be added here
            break;
          
          default:
            allowedScreens.push("/Proposal")
            localStorage.setItem('allowedScreens', JSON.stringify(allowedScreens));

            navigate('/Proposal', { replace: true }); // fallback
        }
      } else {
        setError(response.data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
    }
  };


  return (
    <div className="w-full h-full flex flex-col justify-center items-center px-10 py-12 bg-transparent">
      <div className="w-[561px] flex flex-col items-start gap-4">
        <h2 className="text-[35px] text-[#0F012A] font-medium">Welcome to Kazunov 1AI</h2>

        <div className="w-full">
          <label className="text-sm">Enter Email ID</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-[45px] px-3 border rounded"
          />
        </div>

        <div className="w-full">
          <label className="text-sm">Enter Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-[45px] px-3 border rounded"
          />
        </div>

        <div className="w-full flex justify-end">
          <button
            className="text-sm text-[#0463FF] underline"
            onClick={() => navigate("/Forgot")}
          >
            Forgot Password?
          </button>
        </div>

        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
        {successMsg && <p className="text-green-600 text-sm">{successMsg}</p>}

        <div className="w-full flex justify-end">
          <button
            onClick={handleLogin}
            className="w-[111px] h-[45px] bg-[#71A6FE] text-white rounded"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightSectionLogin;