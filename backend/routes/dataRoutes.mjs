import express from 'express';
import client from '../db.mjs';
import logger from './logger.mjs';

const router = express.Router();

// Get pincodes
router.get('/pincodes', async (req, res) => {
  logger.info('GET /pincodes - Fetching all pincodes');
  try {
    const result = await client.query('SELECT pincode FROM pincode');
    res.json(result.rows);
  } catch (err) {
    logger.error(`❌ Error fetching pincodes: ${err.message}`);
    res.status(500).json({ error: 'Error fetching pincodes' });
  }
});

// Get diagnostic centers
router.get('/centers', async (req, res) => {
  logger.info('GET /centers - Fetching all diagnostic centers');
  try {
    const result = await client.query('SELECT id, name FROM diagnostic_center');
    res.json(result.rows);
  } catch (err) {
    logger.error(`❌ Error fetching centers: ${err.message}`);
    res.status(500).json({ error: 'Error fetching centers' });
  }
});

export default router;