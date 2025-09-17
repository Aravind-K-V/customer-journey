// import express from 'express';
// import client from '../db.mjs';
// import bcrypt from 'bcrypt';
// import logger from './logger.mjs';

// const router = express.Router();

// // REGISTER ROUTE
// router.post('/register', async (req, res) => {
//   const { name, email, password } = req.body;

//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);  // 🔐 Hash the password
//     logger.info(`POST /register - Attempting to register new user: ${email}`);

//     const result = await client.query(
//       'INSERT INTO user_login (name, email_id, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
//       [name, email, hashedPassword, 'customer']
//     );
//     logger.info(`✅ User registered successfully: ${user.email_id}`); // ⬅️ NEW LOG
//     res.json({ success: true, message: 'User registered successfully', user: result.rows[0] });
//   } catch (error) {
//     logger.error(`❌ Register error for user ${email}: ${error.message}`);
//     console.error('Register error:', error);
//     if (error.code === '23505') {
//       res.status(400).json({ success: false, message: 'Email already registered' });
//     } else {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }
// });

// // LOGIN ROUTE
// router.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   console.log('Login Request:', { email, password });
//   logger.info(`POST /login - Attempting to log in user: ${email}`);
//   try {
//     const result = await client.query(
//       'SELECT * FROM user_login WHERE email_id = $1',
//       [email]
//     );

//     if (result.rows.length === 0) {
//       console.log('❌ Email not found in DB');
//       logger.warn(`❌ Login failed for ${email}: Email not found`);
//       return res.status(401).json({ success: false, message: 'Invalid credentials' });
//     }

//     const user = result.rows[0];
//     console.log("🔍 Found user in DB:", user);
//     logger.info(`🔍 Found user in DB: ${user.email_id}`);
//     const match = await bcrypt.compare(password, user.password);
//     console.log("🔍 Password match:", match);

//     if (!match) {
//       console.log('❌ Password mismatch');
//       logger.warn(`❌ Login failed for ${email}: Password mismatch`);
//       return res.status(401).json({ success: false, message: 'Invalid credentials' });
//     }
//     logger.info(`✅ Login successful for user: ${user.email_id}`);
//     res.json({
//       success: true,
//       message: 'Login successful',
//       username: user.name,
//       email: user.email_id,
//       role: user.role,
//     });

//   } catch (error) {
//     console.error('🔥 Login error:', error);
//     logger.error(`🔥 Login error for user ${email}: ${error.message}`);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // RESET PASSWORD ROUTE
// router.post('/reset-password', async (req, res) => {
//   const { email, newPassword } = req.body;
//   logger.info(`POST /reset-password - Attempting to reset password for user: ${email}`);
//   try {
//     const hashedPassword = await bcrypt.hash(newPassword, 10); // ✅ hash it

//     const result = await client.query(
//       'UPDATE user_login SET password = $1 WHERE email_id = $2 RETURNING *',
//       [hashedPassword, email]
//     );

//     if (result.rowCount > 0) {
//       logger.info(`✅ Password successfully reset for user: ${email}`);
//       res.json({ success: true, message: 'Password updated successfully' });
//     } else {
//       logger.warn(`❌ Password reset failed for ${email}: Email not found`);
//       res.status(404).json({ success: false, message: 'Email not found' });
//     }
//   } catch (error) {
//     console.error('Password reset error:', error);
//     logger.error(`❌ Password reset error for user ${email}: ${error.message}`);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// export default router;


import express from 'express';
import client from '../db.mjs';
import bcrypt from 'bcrypt';
import logger from './logger.mjs';

const router = express.Router();

// REGISTER ROUTE
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);  // 🔐 Hash the password
    logger.info(`POST /register - Attempting to register new user: ${email}`);

    const result = await client.query(
      'INSERT INTO user_login (name, email_id, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hashedPassword, 'customer']
    );
    res.json({ success: true, message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    logger.error(`❌ Register error for user ${email}: ${error.message}`);
    console.error('Register error:', error);
    if (error.code === '23505') {
      res.status(400).json({ success: false, message: 'Email already registered' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('Login Request:', { email, password });
  logger.info(`POST /login - Attempting to log in user: ${email}`);
  try {
    const result = await client.query(
      'SELECT * FROM user_login WHERE email_id = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ Email not found in DB');
      logger.warn(`❌ Login failed for ${email}: Email not found`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log("🔍 Found user in DB:", user);
    logger.info(`🔍 Found user in DB: ${user.email_id}`);
    const match = await bcrypt.compare(password, user.password);
    console.log("🔍 Password match:", match);

    if (!match) {
      console.log('❌ Password mismatch');
      logger.warn(`❌ Login failed for ${email}: Password mismatch`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    logger.info(`✅ Login successful for user: ${user.email_id}`);
    res.json({
      success: true,
      message: 'Login successful',
      username: user.name,
      email: user.email_id,
      role: user.role,
    });

  } catch (error) {
    console.error('🔥 Login error:', error);
    logger.error(`🔥 Login error for user ${email}: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

// RESET PASSWORD ROUTE
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  logger.info(`POST /reset-password - Attempting to reset password for user: ${email}`);
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10); // ✅ hash it

    const result = await client.query(
      'UPDATE user_login SET password = $1 WHERE email_id = $2 RETURNING *',
      [hashedPassword, email]
    );

    if (result.rowCount > 0) {
      logger.info(`✅ Password successfully reset for user: ${email}`);
      res.json({ success: true, message: 'Password updated successfully' });
    } else {
      logger.warn(`❌ Password reset failed for ${email}: Email not found`);
      res.status(404).json({ success: false, message: 'Email not found' });
    }
  } catch (error) {
    console.error('Password reset error:', error);
    logger.error(`❌ Password reset error for user ${email}: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

// routes/underwriting.js
router.get("/underwriting/status/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const query = `
      SELECT status 
      FROM underwriting_requests 
      WHERE email = $1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      // ✅ New user: no underwriting request yet
      return res.json({ new_user: true, status: null });
    }

    // ✅ Existing underwriting request found
    return res.json({
      new_user: false,
      status: result.rows[0].status
    });

  } catch (err) {
    console.error("Error fetching underwriting status:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


export default router;
