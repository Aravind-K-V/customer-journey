import express from 'express';
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import pool from './services/db/pool.js'; // Make sure this path is correct for your project
import httpClient from './services/httpClient.js'; // Make sure this path is correct
import { uploadFileToS3 } from './s3Uploader.js'; // Make sure this path is correct
import { insertParsedData, underwritingInitialData } from './services/dbInserter.js'; // Make sure this path is correct
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from './s3Client.js'; // Make sure this path is correct
import { deleteRequestFromUnderwriting } from './services/deleteScripts.js'; // Make sure this path is correct

// --- Import the pg-boss instance ---
import boss from './services/queue.js'; // Make sure this path is correct

axios.defaults.timeout = 3 * 60 * 1000;

const router = express.Router();

// This route remains for generating presigned URLs if needed elsewhere
router.post('/generate-presigned-url', async (req, res) => {
    try {
        const { filename, contentType } = req.body;
        console.log("Generating presigned URL for:", filename);
        const timestamp = Date.now();
        const key = `uploads/${timestamp}_${filename}`;
        const bucket = process.env.AWS_BUCKET_NAME;

        const uploadCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
        });
        const url = await getSignedUrl(s3, uploadCommand, { expiresIn: 300 });

        const metadataCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: `metadata/${timestamp}_metadata.json`,
            Body: JSON.stringify({ key, uploadedAt: new Date().toISOString() }),
            ContentType: 'application/json',
        });
        await s3.send(metadataCommand);

        res.json({ url, key, bucket });
    } catch (err) {
        console.error('Failed to generate presigned URL:', err.message);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

// Your existing proposal approval/rejection routes remain unchanged
router.post('/approve-proposal', async (req, res) => {
    try {
        const { proposerId, proposalNumber } = req.body;
        if (!proposerId || !proposalNumber) {
            return res.status(400).json({ error: "Missing proposerId or proposalNumber" });
        }
        await pool.query('BEGIN');
        const updateQuery = `
            UPDATE underwriting_requests
            SET status = 'Approved', updated_at = CURRENT_TIMESTAMP
            WHERE proposer_id = $1 AND proposal_no = $2 AND status = 'Rules Applied'
            RETURNING *;
        `;
        const result = await pool.query(updateQuery, [proposerId, proposalNumber]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "No matching proposal found or already approved" });
        }
        console.log("Proposal approved:", result.rows[0]);
        await pool.query('COMMIT');
        res.json({ success: true, proposal: result.rows[0] });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("Error approving proposal:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/reject-proposal', async (req, res) => {
    try {
        const { proposerId, proposalNumber } = req.body;
        if (!proposerId || !proposalNumber) {
            return res.status(400).json({ error: "Missing proposerId or proposalNumber" });
        }
        await pool.query('BEGIN');
        const updateQuery = `
            UPDATE underwriting_requests
            SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP
            WHERE proposer_id = $1 AND proposal_no = $2 AND status = 'Applied'
            RETURNING *;
        `;
        const result = await pool.query(updateQuery, [proposerId, proposalNumber]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "No matching proposal found or already rejected" });
        }
        console.log("Proposal rejected:", result.rows[0]);
        await pool.query('COMMIT');
        res.json({ success: true, proposal: result.rows[0] });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error("Error rejecting proposal:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// --- FULLY MODIFIED ROUTE: This now handles the entire upload and queueing process ---
router.post('/save-support-docs', async (req, res) => {
    try {
        const { filename, contentType, proposerId, proposalNumber, file_type, first_member } = req.body;
        console.log(`[API] Saving support document: ${filename} for proposer: ${proposerId}`);

        const timestamp = Date.now();
        const key = `uploads/${timestamp}_${filename}`;
        const bucket = process.env.AWS_BUCKET_NAME;

        // Step 1: Generate a presigned URL for the client to upload to S3
        const uploadCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
        });
        const uploadUrl = await getSignedUrl(s3, uploadCommand, { expiresIn: 300 });
        const s3Link = `s3://${bucket}/${key}`;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Step 2: Insert the document metadata into your database
            const insertQuery = `
                INSERT INTO documents (member_id, proposal_number, document_type, source_url, proposer_id, processing_status, created_at)
                VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
                RETURNING id;
            `;
            const result = await client.query(insertQuery, [first_member, proposalNumber, file_type, s3Link, proposerId]);
            const documentId = result.rows[0].id;
            console.log(`[DB] Document record created with ID: ${documentId}`);

            // Step 3: Update the main underwriting request status to show documents have been uploaded
            await client.query(
                `UPDATE underwriting_requests
                 SET status = 'Documents Uploaded', updated_at = CURRENT_TIMESTAMP
                 WHERE proposal_no = $1 AND proposer_id = $2 AND status = 'Rules Applied'`,
                [proposalNumber, proposerId]
            );

            // --- Step 4: Send a job to the background worker queue ---
            const queueName = 'document-processing';
            const jobData = {
                documentId: documentId,
                proposerId: proposerId,
                documentType: file_type, // This is crucial for the worker to know how to process it
                s3Url: s3Link
            };
            await boss.send(queueName, jobData);
            console.log(`[Queue] Job sent to '${queueName}' for Document ID: ${documentId}`);
            // ---------------------------------------------------------
            
            await client.query('COMMIT');
            
            // Step 5: Respond to the client immediately with the upload URL
            res.json({ url: uploadUrl, key, bucket, s3Link, documentId });

        } catch (dbErr) {
            await client.query('ROLLBACK');
            console.error('[API] Database transaction failed during document save:', dbErr.message);
            throw dbErr;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('[API] Failed to save document and queue job:', err.message);
        res.status(500).json({ error: 'Failed to process document upload' });
    }
});


// Note: The '/upload' route that streams data might now be redundant for this flow.
// You can choose to keep it for other purposes or remove it if '/save-support-docs' is the new standard.
router.post('/upload', async (req, res) => {
    // This route logic can be deprecated if the new flow is used exclusively.
    // ... (existing code for /upload)
    const { s3_url, product_type, user_email } = req.body;
    // ...
    res.status(501).json({ message: "This endpoint is deprecated. Please use /save-support-docs." });
});

export default router;
