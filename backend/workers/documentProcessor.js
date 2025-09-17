import pool from '../services/db/pool.js'; // CORRECTED PATH
import boss from '../services/queue.js';   // CORRECTED PATH
import logger from '../routes/logger.mjs'; // Assuming this path is correct
import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';

// A mapping of your document types to determine how they should be processed
const DOCUMENT_PROCESSING_MAP = {
    'PAN Card': 'finance',
    'Bank Statement': 'finance',
    'ITR': 'finance',
    'Payslip': 'finance',
    'Medical Report': 'medical',
    // Add other document types here, defaulting to 'medical' if not specified
};

// Main function that routes jobs to the correct processor
async function processDocumentJob(job) {
    const { documentId, documentType } = job.data;
    prettyLog(`[Worker] Picked up job for Document ID: ${documentId}`, { type: documentType }, { level: 'info' });

    // Determine the processing type (e.g., 'finance' or 'medical')
    const processingType = DOCUMENT_PROCESSING_MAP[documentType] || 'medical';

    try {
        // Set document status to 'processing' immediately
        await pool.query("UPDATE documents SET processing_status = 'processing' WHERE id = $1", [documentId]);
        prettyLog(`[Worker] Document status set to 'processing' for ID: ${documentId}`, null, { level: 'debug' });

        // Route the job to the correct handler
        if (processingType === 'finance') {
            await processFinancialDocument(job.data);
        } else {
            await processMedicalDocument(job.data);
        }

        // Set final status to 'completed'
        await pool.query("UPDATE documents SET processing_status = 'completed', validated = true, processed_at = NOW() WHERE id = $1", [documentId]);
        prettyLog(`[Worker] Successfully completed job for Document ID: ${documentId}`, null, { level: 'info' });

    } catch (error) {
        prettyLog(`[Worker] Job failed for Document ID ${documentId}`, { error: error.message, stack: error.stack }, { level: 'error' });
        // Set status to 'failed' in the database
        await pool.query("UPDATE documents SET processing_status = 'failed' WHERE id = $1", [documentId]);
        // Re-throw the error to let pg-boss handle the retry logic
        throw error;
    }
}

// Processor for financial documents - calls your Python service
async function processFinancialDocument(data) {
    const { documentId, proposerId, s3Url } = data; // Pass proposerId to the Python service
    prettyLog(`[Worker][Finance] Processing financial document: ${documentId}`, { proposerId }, { level: 'info' });

    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://13.202.6.228:8091';
    
    // IMPORTANT: Call the Python API endpoint that expects proposer_id
    const response = await axios.post(`${pythonApiUrl}/process-document/${documentId}`, {
        proposer_id: proposerId
    });

    const extractedData = response.data;

    // Update the documents table with the data extracted by the Python service
    const updateQuery = `
        UPDATE documents
        SET extracted_data = $1
        WHERE id = $2;
    `;
    await pool.query(updateQuery, [JSON.stringify(extractedData), documentId]);
    prettyLog(`[Worker][Finance] Stored extracted data from Python service for document: ${documentId}`, null, { level: 'info' });
}

// Processor for medical documents - calls the general IDP
async function processMedicalDocument(data) {
    const { documentId, s3Url } = data;
    prettyLog(`[Worker][Medical] Processing medical document: ${documentId}`, null, { level: 'info' });
    
    const idpUrl = process.env.IDP_API_URL_MEDICAL || 'http://205.147.102.131:8000/upload/medical';
    const idpResponse = await axios.post(idpUrl, { s3_url: s3Url, api_key: process.env.IDP_API_KEY });
    
    const extractedData = idpResponse.data;

    const updateQuery = `
        UPDATE documents
        SET extracted_data = $1
        WHERE id = $2;
    `;
    await pool.query(updateQuery, [JSON.stringify(extractedData), documentId]);
    prettyLog(`[Worker][Medical] Stored extracted data for document: ${documentId}`, null, { level: 'info' });
}

// Function to start the worker
export async function startDocumentWorker() {
    await boss.start();
    const queueName = 'document-processing';
    logger.info(`[Worker] Worker listening for jobs on queue: ${queueName}`, null, { level: 'info' });
    // This starts the worker listening for jobs on the specified queue
    await boss.work(queueName, { newJobCheckInterval: 5000 }, processDocumentJob);
}
