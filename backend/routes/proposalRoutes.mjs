import express from 'express';
import client from '../db.mjs'; // your DB connection
const router = express.Router();

// Route to get the stored proposer email by request_id and compare with login email
router.post('/check-proposer-email', async (req, res) => {
  try {
    const { request_id, login_email } = req.body;
    if (!request_id || !login_email) {
      return res.status(400).json({ message: "Missing request_id or login_email" });
    }

    const query = 'SELECT email FROM Proposer WHERE proposer_id = $1';
    const { rows } = await client.query(query, [request_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Request ID not found" });
    }

    const storedEmail = rows[0].email;

    if (!storedEmail) {
      // If no email stored, suggest update by returning mismatch and a flag
      return res.status(200).json({ match: false, storedEmail: null });
    }

    if (storedEmail.toLowerCase() === login_email.toLowerCase()) {
      return res.status(200).json({ match: true, storedEmail });
    } else {
      return res.status(200).json({ match: false, storedEmail });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update the email update endpoint to use proposerId consistently
router.post('/update-proposer-email', async (req, res) => {
  try {
    const { request_id, new_email } = req.body;
    console.log(`📩 [POST] /api/proposals/update-proposer-email called with request_id: ${request_id}, new_email: ${new_email}`);

    if (!request_id || !new_email) {
      return res.status(400).json({ message: "Missing request_id or new_email" });
    }

    // CHANGE THIS LINE - use proposerId consistently
    try {
      await client.query('BEGIN');

      const updateProposer = `
    UPDATE proposer 
    SET email = $1, updated_at = CURRENT_TIMESTAMP
    WHERE proposer_id = $2 
    RETURNING *;
  `;
      const proposerResult = await client.query(updateProposer, [new_email, proposer_id]);

      const updateUnderwriting = `
    UPDATE underwriting_requests
    SET email = $1
    WHERE request_id = $2
    RETURNING *;
  `;
      const underwritingResult = await client.query(updateUnderwriting, [new_email, request_id]);

      await client.query('COMMIT');

      console.log(proposerResult.rows, underwritingResult.rows);

      if (underwritingResult.length === 0 && proposerResult.length == 0) {
        console.warn(`❌ No record found for request_id: ${request_id}`);
        return res.status(404).json({ message: "Record not found" });
      }
      console.log(`✅ Email updated successfully for request_id: ${request_id}`);
      res.status(200).json({
        message: "Email updated successfully",
        updatedRecord: proposerResult[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});
export default router;