// routes/input.js
import express from 'express';
import pool from '../services/db/pool.js'; // Assuming you have a pool instance exported from db.mjs
const router = express.Router();
import axios from 'axios';

async function extractInputData(proposerId) {

  const client = await pool.connect();
  try {
    console.log("✅ Starting database transaction...");
    await client.query('BEGIN');

    const proposerRes = await client.query(
      `SELECT age, address, city, district, state, pin_code, occupation, annual_income, employment_type
       FROM proposer WHERE proposer_id = $1`,
      [proposerId]
    );
    console.log("proposerRes", proposerRes.rows);

    if (proposerRes.rows.length === 0) throw new Error('Proposer not found');
    const proposer = proposerRes.rows[0];

    const proposalRes = await client.query(
      `SELECT product_type FROM proposal WHERE proposer_id = $1 LIMIT 1`,
      [proposerId]
    );
    console.log("proposalRes", proposalRes.rows);

    const product_type = proposalRes.rows[0]?.product_type;
    console.log("product_type", product_type);

    const insuredRes = await client.query(
      `SELECT height_cm, weight_kg, deductible, sum_insured
       FROM insured_member WHERE proposer_id = $1 LIMIT 1`,
      [proposerId]
    );
    console.log("insuredRes", insuredRes.rows);
    const insured = insuredRes.rows[0] || {};

    console.log("✅ Querying medical_condition...");

    const memberIdsRes = await client.query(
      `SELECT member_id FROM insured_member WHERE proposer_id = $1`,
      [proposerId]
    );
    console.log("Found member IDs for proposer", proposerId, ":", memberIdsRes.rows);

    // If no members found, handle appropriately
    if (memberIdsRes.rows.length === 0) {
      console.log("No insured members found for this proposer");
      // You might want to return empty medical data or throw an error
    }

    const medicalRes = await client.query(
      `SELECT
        -- Thyroid
        thyroid_disorder,
        
        -- Digestive System
        gerd,
        ulcerative_colitis,
        crohns_disease,
        fatty_liver,
        liver_cirrhosis,
        hepatitis,
        pcod_pcos,
        
        -- ENT Disorders
        hearing_loss,
        cochlear_implants,
        cataract,
        glaucoma,
        
        -- Diabetes
        diabetes_type_1,
        diabetes_type_2,
        
        -- Cancer
        breast_cancer,
        lung_cancer,
        prostate_cancer,
        oral_cancer,
        colon_cancer,
        leukemia,
        lymphoma,
        brain_tumor,
        
        -- Heart Conditions
        heart_attack,
        heart_failure,
        coronary_artery_disease,
        stroke,
        arrhythmia,
        congenital_heart_defect,
        
        -- Liver Conditions
        fatty_liver,
        liver_cirrhosis,
        hepatitis,
        
        -- Kidney Conditions
        kidney_stones,
        chronic_kidney_disease,
        kidney_damage,
        frequent_uti,
        dialysis_required

       FROM medical_condition
       WHERE person_id IN (
         SELECT member_id FROM insured_member WHERE proposer_id = $1
       )`,
      [proposerId]
    );
    console.log("medicalRes", medicalRes.rows);
    const medical = medicalRes.rows[0] || {};

    // --- Lifestyle Info query ---
    const lifestyleRes = await client.query(
      `SELECT smoking_status, alcohol_consumption,
              hereditary_risk, occupational_risk, physical_activity, sleep_hours, tobacco_usage
       FROM lifestyle_info
       WHERE member_id IN (
         SELECT member_id FROM insured_member WHERE proposer_id = $1
       ) LIMIT 1`,
      [proposerId]
    );
    const lifestyle = lifestyleRes.rows[0] || {};

    // Compute PFD
    const PFD = (
      lifestyle.smoking_status === "yes" ||
      lifestyle.tobacco_usage === "yes" ||
      lifestyle.alcohol_consumption === "yes" ||
      lifestyle.hereditary_risk === true ||
      lifestyle.occupational_risk === true ||
      (lifestyle.physical_activity && lifestyle.physical_activity.toLowerCase() === "yes") ||
      (lifestyle.sleep_hours && Number(lifestyle.sleep_hours) > 0)
    ) ? "yes" : "no";

    // --- Previous Insurance query ---
    const prevInsuranceRes = await client.query(
      `SELECT prev_insurance_id
       FROM previous_insurance
       WHERE proposer_id = $1 LIMIT 1`,
      [proposerId]
    );
    const OTH = prevInsuranceRes.rows.length > 0 ? "yes" : "no";

    const bmi = insured.height_cm && insured.weight_kg
      ? insured.weight_kg / ((insured.height_cm / 100) ** 2)
      : null;


    const data = {
      PT: product_type,
      Age: proposer.age,
      CLOC: {
        address: proposer.address,
        city: proposer.city,
        district: proposer.district,
        state: proposer.state,
        pin_code: proposer.pin_code
      },
      OCC: proposer.occupation,
      Inc: proposer.annual_income,
      Employment_Type: proposer.employment_type,
      Insured: {
        height_cm: insured.height_cm,
        weight_kg: insured.weight_kg,
        Ded: insured.deductible,
        SA: insured.sum_insured,
      },
      Thyroid_Disorders: medical.thyroid_disorder ? "yes" : "no",
      Digestive_System_Disorders: (medical.gerd || medical.ulcerative_colitis ||
        medical.crohns_disease || medical.fatty_liver ||
        medical.liver_cirrhosis || medical.hepatitis ||
        medical.pcod_pcos) ? "yes" : "no",
      ENT_Disorders: (medical.hearing_loss || medical.cochlear_implants ||
        medical.cataract || medical.glaucoma) ? "yes" : "no",
      Diabetes: (medical.diabetes_type_1 || medical.diabetes_type_2) ? "yes" : "no",
      Cancer: (medical.breast_cancer || medical.lung_cancer ||
        medical.prostate_cancer || medical.oral_cancer ||
        medical.colon_cancer || medical.leukemia ||
        medical.lymphoma || medical.brain_tumor) ? "yes" : "no",
      Heart_Attack: (medical.heart_attack || medical.heart_failure ||
        medical.coronary_artery_disease || medical.stroke ||
        medical.arrhythmia || medical.congenital_heart_defect) ? "yes" : "no",
      Chronic_Liver: (medical.fatty_liver || medical.liver_cirrhosis ||
        medical.hepatitis) ? "yes" : "no",
      Kidney: (medical.kidney_stones || medical.chronic_kidney_disease ||
        medical.kidney_damage || medical.frequent_uti ||
        medical.dialysis_required) ? "yes" : "no",
      Tobacco: lifestyle.tobacco_usage ? "yes" : "no"
    };
    console.log("Extracted data:", data);
    await client.query('COMMIT');

    return data;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in extractInputData:', err);
    throw err; // Re-throw the error
  }
  finally {
    client.release();
  }
}

// export { extractInputData };
router.post('/extract', async (req, res) => {
  try {
    const { proposerId } = req.body;
    console.log("Proposer ID", proposerId);
    if (!proposerId) {
      return res.status(400).json({
        success: false,
        error: 'Proposer ID is required in request body'
      });
    }

    console.log("Calling extractInputData...");
    const data = await extractInputData(proposerId);
    console.log("Data sent in response:", data);

    res.json({
      success: true,
      data: data
      
    });

  } catch (error) {
    console.error('Error in extractInputData:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;