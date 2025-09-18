// server.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import s3Routes from './s3Routes.js';
import dataRoutes from './routes/dataRoutes.mjs';
import authRoutes from './routes/authRoutes.mjs';
import proposalRoutes from './routes/proposalRoutes.mjs';
import idpHandlerRoute from './routes/idpHandlerRoute.js';
import ruleEngineRoutes from './routes/ruleEngineRoutes.mjs';
import mainFlowRoutes from './routes/mainFlowRoutes.mjs';

// --- FIX: Import the worker starter function ---
import { startDocumentWorker } from './workers/documentProcessor.js';
// ---------------------------------------------

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Route mount
app.use('/', s3Routes);
app.use('/api', dataRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/idp', idpHandlerRoute);
app.use('/api/ruleEngineRoutes', ruleEngineRoutes);
app.use('/api/mainflow', mainFlowRoutes);

// Health check
app.get('/health', (req, res) => {
    res.send('Server is up and running');
});

app.listen(PORT, () => {
    console.log(`Server running on http://13.232.45.218:${PORT}`);
    
    // Now this function call will work correctly
    startDocumentWorker().catch(error => {
        console.error("Failed to start document worker:", error);
        process.exit(1); // Exit if the worker fails to start
    });
});
