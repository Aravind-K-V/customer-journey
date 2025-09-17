import express from 'express';
import client from '../db.mjs';
import logger from './logger.mjs'; // Assuming you have a logger module

const router = express.Router();


router.get("/rule-check", async (req, res) => {
  const email = req.query.email;
  try {
    const result = await client.query(
      `
      SELECT 
        re.finreview_required, 
        re.mc_required, 
        re.televideoagent_required,
        re.expected_data,
        re.customer_data,
        re.rule_status,
        ur.proposer_id,
        p.proposal_number,
        im.member_id
      FROM underwriting_requests ur
      JOIN rule_engine_trail re
        ON ur.request_id = re.request_id
      LEFT JOIN proposal p
        ON ur.proposer_id = p.proposer_id
      LEFT JOIN insured_member im
        ON ur.proposer_id = im.proposer_id
      WHERE ur.email = $1
      ORDER BY re.created_at DESC
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No record found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// router.post('/save-rule-engine-result', async (req, res) => {
//   const {
//     request_id, // Assuming this is used for logging or tracking
//     proposal_number,
//     statuses,
//     mc_required,
//     televideoagent_required,
//     finreview_required,
//     original_input,        // Original input JSON
//     expected_data           // Human-readable rule
//   } = req.body;

//   console.log("Incoming Rule Engine Data:", req.body);

//   try {
//     if (!request_id || !proposal_number || !Array.isArray(statuses) || statuses.length === 0) {
//       logger.warn(`❌ Invalid rule engine data received. proposalNumber or statuses missing. Data: ${JSON.stringify(req.body)}`);
//       return res.status(400).json({ success: false, message: 'request_id, proposalNumber and statuses are required' });
//     }

//     // ✅ Prioritize Non-STP if present
//     const rule_status = statuses.includes('Non-STP') ? 'Non-STP' : statuses[0];
//     await client.query('BEGIN');

//     const query = `
//   INSERT INTO rule_engine_trail 
//   (request_id, proposal_number, rule_status, mc_required, televideoagent_required, finreview_required,  customer_data, expected_data, created_at)
//   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
//   RETURNING *;
// `;

//     await client.query(query, [
//       request_id,
//       proposal_number,
//       rule_status,
//       mc_required || false,
//       televideoagent_required || false,
//       finreview_required || false,
//       JSON.stringify(original_input),  // expected_data column
//       JSON.stringify(expected_data)                 // rule_id column
//     ]);

//     const result = await client.query(
//       `UPDATE underwriting_requests
//         SET
//           updated_at = CURRENT_TIMESTAMP,
//           status = 'Rules Applied'
//         WHERE
//           request_id = $1 AND status='Processed by IDP'`,
//       [request_id]
//     );


//     await client.query('COMMIT');

//     logger.info(`✅ Rule engine output saved for proposal_number: ${proposal_number} with status: ${rule_status}`);
//     res.json({ success: true, message: 'Rule engine output saved successfully' });

//   } catch (error) {
//     await client.query('ROLLBACK');
//     console.error('Error saving rule output:', error.stack);
//     logger.error(`❌ Error saving rule output for proposal_number ${req.body.proposal_number}: ${error.stack}`);
//     res.status(500).json({ success: false, message: 'Database error', error: error.message });
//   }
// });
router.get("/rule-check", async (req, res) => {
  const email = req.query.email;
  try {
    const result = await client.query(
      `
      SELECT 
        re.finreview_required, 
        re.mc_required, 
        re.televideoagent_required,
        ur.proposer_id,
        p.proposal_number,
        im.member_id
      FROM underwriting_requests ur
      JOIN rule_engine_trail re
        ON ur.request_id = re.request_id
      LEFT JOIN proposal p
        ON ur.proposer_id = p.proposer_id
      LEFT JOIN insured_member im
        ON ur.proposer_id = im.proposer_id
      WHERE ur.email = $1
      ORDER BY re.created_at DESC
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No record found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post('/save-rule-engine-result', async (req, res) => {
  const {
    request_id,
    proposal_number,
    statuses,
    mc_required,
    televideoagent_required,
    finreview_required,
    customer_data,
    expected_data
  } = req.body;

  console.log("Incoming Rule Engine Data:", req.body);

  try {
    // Validate required fields
    if (!request_id || !proposal_number || !Array.isArray(statuses) || statuses.length === 0) {
      logger.warn(`❌ Invalid rule engine data received. Required fields missing. Data: ${JSON.stringify(req.body)}`);
      return res.status(400).json({ success: false, message: 'request_id, proposalNumber and statuses are required' });
    }

    // NEW: Require both data fields
    if (!customer_data || !expected_data) {
      logger.warn(`❌ Incomplete rule engine data received. Data: ${JSON.stringify(req.body)}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Both original_input and expected_data are required' 
      });
    }

    // ✅ Prioritize Non-STP if present
    const rule_status = statuses.includes('Non-STP') ? 'Non-STP' : statuses[0];
    await client.query('BEGIN');

    // Insert complete data (only one record per request)
    const query = `
      INSERT INTO rule_engine_trail 
      (request_id, proposal_number, rule_status, mc_required, televideoagent_required, finreview_required, customer_data, expected_data, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *;
    `;

    await client.query(query, [
      request_id,
      proposal_number,
      rule_status,
      mc_required || false,
      televideoagent_required || false,
      finreview_required || false,
      JSON.stringify(customer_data),  // customer_data column
      JSON.stringify(expected_data)     // expected_data column
    ]);

    const result = await client.query(
      `UPDATE underwriting_requests
        SET
          updated_at = CURRENT_TIMESTAMP,
          status = 'Rules Applied'
        WHERE
          request_id = $1 AND status='Processed by IDP'`,
      [request_id]
    );

    await client.query('COMMIT');

    logger.info(`✅ Rule engine output saved for proposal_number: ${proposal_number} with status: ${rule_status}`);
    res.json({ success: true, message: 'Rule engine output saved successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving rule output:', error.stack);
    logger.error(`❌ Error saving rule output for proposal_number ${req.body.proposal_number}: ${error.stack}`);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
});

export default router;