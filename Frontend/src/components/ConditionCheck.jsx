import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ConditionCheck = () => {
  const navigate = useNavigate();
  const [ruleEngineData, setRuleEngineData] = useState(null);
  const [rawData, setRawData] = useState(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem("ruleEngineData");
    const storedRawData = sessionStorage.getItem("rawFormData");

    if (storedData) {
      setRuleEngineData(JSON.parse(storedData));
    }
    if (storedRawData) {
      setRawData(JSON.parse(storedRawData));
    }
  }, []);

  const inference = sessionStorage.getItem("inference") || "N/A";
  const isNonSTP = inference.includes("Non-STP");

  if (!ruleEngineData) {
    return <p className="text-gray-500">No rule engine data available.</p>;
  }

  const handleProceed = () => {
    const nextRoute = sessionStorage.getItem("nextRoute") || "/non-stp";
    navigate(nextRoute);
  };

  const expectedData = ruleEngineData.expected_data || {};
  const customerData = ruleEngineData.customer_data || {};

  // 🔹 Normalize keys
  const normalizeKey = (key) => {
    return key
      .replace(/_/g, " ")
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  // 🔹 Normalized customer object
  const normalizedCustomer = {};
  Object.keys(customerData).forEach((key) => {
    normalizedCustomer[normalizeKey(key)] = customerData[key];
  });

  // 🔹 OCCUPATION MAPPING
  const mapOccupation = (occupation, productType) => {
    const occ = String(occupation || "").toLowerCase();

    if (productType === "Health Insurance") {
      const highRiskJobs = [
        "driver", "construction", "mining", "firefighter", "police", "army", "navy", "air force",
        "railway", "shipyard", "fisherman", "electrician", "factory", "manual labor", "security"
      ];
      return highRiskJobs.some(job => occ.includes(job)) ? "High-Risk" : "Normal";
    } else {
      const sportsJobs = [
        "cricket", "football", "athlete", "sports", "driver", "construction", "mining",
        "firefighter", "police", "army", "navy", "air force", "kabaddi", "volleyball",
        "hockey", "badminton", "tennis", "boxing", "wrestling", "cycling", "swimming",
        "gymnastics", "koko", "chess", "martial arts", "weightlifting", "archery",
        "skating", "javelin throw", "shot put", "high jump", "long jump", "railway",
        "shipyard", "fisherman", "electrician", "factory", "manual labor", "security"
      ];
      if (sportsJobs.some(job => occ.includes(job))) {
        return "Sports";
      } else if (occ.includes("housewife") || occ.includes("homemaker")) {
        return "Housewife";
      } else {
        return "Desk/Sedentary";
      }
    }
  };

  // 🔹 LOCATION MAPPING
  const mapLocation = (city, pincode) => {
    const cityStr = String(city || "").toLowerCase();
    const pinStr = String(pincode || "");

    const redZonePincodes = ["400001", "400002", "400003", "110001", "110002", "110003"];
    const redZoneCities = ["mumbai", "assam", "delhi", "kolkata", "srinagar", "navi mumbai", "jammu & kashmir"];

    if (redZonePincodes.includes(pinStr)) return "Red";
    if (redZoneCities.some(redCity => cityStr.includes(redCity))) return "Red";
    return "Normal";
  };

  // 🔹 Check if value is within range
  const isWithinRange = (expected, provided) => {
    if (!expected || provided === undefined || provided === null) return false;

    let value = Number(provided);
    if (isNaN(value)) return false;

    try {
      let ranges = JSON.parse(expected.replace(/'/g, '"'));
      if (!Array.isArray(ranges[0])) ranges = [ranges];
      return ranges.some(([min, max]) => value >= min && value <= max);
    } catch {
      return false;
    }
  };

  // 🔹 Format helpers
  const formatCustAmount = (amount) => {
    let num = Number(amount);
    if (isNaN(num)) return amount;
    const hasDecimal = amount.toString().includes(".");
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: hasDecimal ? 2 : 0,
    });
  };

  const formatRange = (str) => {
    try {
      let [start, end] = JSON.parse(str.replace(/'/g, '"'));
      return `[${start.toLocaleString("en-IN")}, ${end.toLocaleString("en-IN")}]`;
    } catch {
      return str;
    }
  };

  // 🔹 Build matched conditions (skip null/empty values)
  const matchedConditions = Object.keys(expectedData)
    .map((key) => {
      let expectedValue = expectedData[key];
      let customerValue = normalizedCustomer[key];

      if (!expectedValue || !customerValue) return null;

      if (key === "PFD Conditions" && !customerValue) {
        customerValue = "None";
        key = "Prop Form Declaration";
      }

      if (key === "Location") {
        expectedValue = expectedValue?.city || "";
        customerValue = customerValue?.city || "";
        key = "Location Category";
      }

      let rawExpectedValue = String(expectedValue || "").trim();
      let rawCustomerValue = String(customerValue || "").trim();

      if (key === "Deductible" || key === "Sum Insured") {
        rawExpectedValue = formatRange(rawExpectedValue);
        rawCustomerValue = formatCustAmount(rawCustomerValue);
      }

      let matched = false;
      if (/\[.*\]/.test(expectedValue) && !isNaN(Number(rawCustomerValue))) {
        matched = isWithinRange(expectedValue, rawCustomerValue);
      } else {
        matched = rawExpectedValue.toUpperCase() === rawCustomerValue.toUpperCase();
      }

      if (matched) {
        return {
          condition: key,
          expected: rawExpectedValue,
          provided: rawCustomerValue,
        };
      }
      return null;
    })
    .filter(Boolean);

  // 🔹 Flags
  const flags = [];
  if (ruleEngineData.mc_required) flags.push("Medical Review Required");
  if (ruleEngineData.finreview_required) flags.push("Financial Review Required");
  if (ruleEngineData.televideoagent_required) flags.push("Telemedical Review Required");

  return (
    <div className="flex flex-col items-start p-4 bg-white rounded-md shadow-[0px_0px_12px_0px_rgba(51,113,242,0.09)] w-full">
      <h2 className="text-black text-xl font-bold mb-2">Underwriting Rules Details</h2>

      <div className="w-full text-lg mb-2">
        <p>
          <span className="font-bold text-[#0F012A]">Rule Inference:</span> {inference}
        </p>
        {flags.length > 0 && (
          <div className="w-full mt-2 space-y-1">
            {flags.map((flag, idx) => (
              <p key={idx} className="text-[#0F012A] font-semibold text-base">
                {flag}
              </p>
            ))}
          </div>
        )}
      </div>

      {matchedConditions.length > 0 ? (
        <table className="w-full text-sm text-left border border-[#E2EAFB] rounded-md overflow-hidden mb-3">
          <thead className="bg-[#EDF2FD] text-[#0F012A] font-medium">
            <tr>
              <th className="px-3 py-2">Condition</th>
              <th className="px-3 py-2">Proposal-Specific Rule</th>
              <th className="px-3 py-2">Provided by Customer</th>
            </tr>
          </thead>
          <tbody className="text-[#534B68]">
            {matchedConditions.map((row, idx) => (
              <tr key={idx} className="border-t border-[#E2EAFB]">
                <td className="px-3 py-2 font-medium text-[#0F012A]">{row.condition}</td>
                <td className="px-3 py-2">{row.expected}</td>
                <td className="px-3 py-2">{row.provided}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 mb-3">No matched conditions found.</p>
      )}

      <button
        onClick={handleProceed}
        className="w-full h-9 bg-[#3371F2] rounded text-white text-xs font-medium uppercase tracking-wider"
      >
        Proceed
      </button>
    </div>
  );
};

export default ConditionCheck;
