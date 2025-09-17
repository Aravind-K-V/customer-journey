import express from "express";
import axios from "axios";
import { underwritingInitialData, insertParsedData, ensureUserExists } from "../services/dbInserter.js";

const router = express.Router();

router.post("/flow", async (req, res) => {
  try {
    // Pull out email and product_type, rest goes into jsonData
    const { product_type, email, ...jsonData } = req.body;

    // Ensure user exists in login table
    await ensureUserExists(email, jsonData.customer_name || "New User");

    const dataWithEmail = {
      ...jsonData,
      email: email // Add the email back to the data object
    };

    // 1️⃣ Save JSON in DB
    const requestId = await underwritingInitialData(product_type, email, true);
    const insertResult = await insertParsedData(dataWithEmail, product_type, requestId, email);
    const proposerId = insertResult.proposer_id;

    // 2️⃣ Extract required fields using your existing IDP handler logic
    const idpResponse = await axios.post("http://localhost:8000/api/idp/extract", {
      proposerId: proposerId,
    });

    console.log("Full IDP Response:", idpResponse.data);

    // Check if data exists
    if (!idpResponse.data.success || !idpResponse.data.data) {
      throw new Error("IDP extraction failed or returned no data");
    }

    const extractedData = idpResponse.data.data;

    console.log("Extracted Data:", extractedData);
    console.log("Type of extractedData:", typeof extractedData);

    // 3️⃣ Call FastAPI → extractor.py
    console.log("Sending to /convert_to_structure:", extractedData);
    await axios.post("http://localhost:5050/convert_to_structure", {extractedData: extractedData});

    // 4️⃣ Call FastAPI → rule engine
    const ruleEngineResponse = await axios.post("http://localhost:5050/rule_engine", {
        request_id: requestId,
        proposalNumber: jsonData.proposal_number
    });

    // // 5️⃣ Save rule engine output in your Node `ruleEngineRoutes`
    // await axios.post("http://localhost:8000/api/ruleEngineRoutes/save-rule-engine-result", {
    //     request_id: ruleEngineResponse.data.request_id,
    //     proposal_number: ruleEngineResponse.data.proposal_number,
    //     statuses: ruleEngineResponse.data.statuses,
    //     mc_required: ruleEngineResponse.data.mc_required,
    //     televideoagent_required: ruleEngineResponse.data.televideoagent_required,
    //     finreview_required: ruleEngineResponse.data.finreview_required
    // });

    // 6️⃣ Return final response to insurance company
    res.json({
      success: true,
      message: "Workflow completed",
      ruleEngineOutput: ruleEngineResponse.data,
    });

  } catch (error) {
    console.error("❌ Error in mainflow:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
