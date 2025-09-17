import pool from './db/pool.js';
import bcrypt from "bcrypt";
import { deleteRequestFromUnderwriting } from './deleteScripts.js';

function cleanGST(val) {
  if (!val || val === "0" || val === "" || val === "Not Applicable") {
    return null;  // ✅ DB will accept NULL
  }
  return val;
}

function formatDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;

  // If already in YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Split on either "-" or "/"
  const parts = dateStr.split(/[-/]/);
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  if (!day || !month || !year) return null;

  return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function calculateAge(dobStr) {
  if (!dobStr || typeof dobStr !== 'string') return null;

  // Normalize separators
  const normalized = dobStr.replace(/\//g, '-');

  let year, month, day;

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    // YYYY-MM-DD
    [year, month, day] = normalized.split('-');
  }
  else if (/^\d{2}-\d{2}-\d{4}$/.test(normalized)) {
    // DD-MM-YYYY
    [day, month, year] = normalized.split('-');
  }
  else {
    return null; // unsupported format
  }

  const dob = new Date(`${year}-${month}-${day}`);
  if (isNaN(dob.getTime())) return null; // invalid date

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}



function cleanValue(val) {
  return (val === 'Not Applicable' || val === '') ? null : val;
}

export async function ensureUserExists(user_email, name = "New User") {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT email_id FROM user_login WHERE email_id = $1",
      [user_email]
    );

    if (result.rows.length > 0) {
      return result.rows[0].email_id; // already exists
    }

    const hashedPassword = await bcrypt.hash("default@123", 10); // 🔐 default password
    const insert = await client.query(
      "INSERT INTO user_login (name, email_id, password, role) VALUES ($1, $2, $3, $4) RETURNING email_id",
      [name, user_email, hashedPassword, "customer"]
    );

    console.log(`✅ Created new user with email: ${user_email}`);
    return insert.rows[0].email_id;
  } finally {
    client.release();
  }
}

export async function underwritingInitialData(product_type, user_email, isApi=true) {
  console.log(`product_type ${product_type} in underwriting requests for email ${user_email}, isApi=${isApi}`)
  const client = await pool.connect()
  const defaultStatus = "Request Received"
  try {
    const initialEntry = await client.query(
      `INSERT into underwriting_requests (
      status,product_type, email, is_api
      ) VALUES (
         $1,$2,$3,$4) RETURNING request_id`,
      [defaultStatus, product_type, user_email, isApi]
    );
    const request_id = initialEntry.rows[0].request_id
    return request_id
  } catch (err) {
    console.log(`Error in writing into underwriting requests (Initial)${err}`)
  } finally {
    client.release();
  }
}

export async function insertParsedData(data, product_type, request_id, user_email) {
  const client = await pool.connect();
  let members = []
  try {
    await client.query('BEGIN');

    const insertOne = async (entry) => {
      const {
        proposal_number, customer_name, father_name,
        dob, sex, nationality, address, city, district, state, pin_code,
        phone_std, phone_number, mobile, email, residential_status, nri_status,
        country_of_residence, qualification, occupation, gst, identity_proof,
        annual_income, income_proof, employment_type, employer_name, designation,
        duty_nature, length_of_service, ckyc_number, pan_number,
        initial_cash_benefit_chosen, marital_status, prev_policy_no, cash_benefit_availed,
        cash_benefit_lapsed_status, term_rider_sum, accident_rider_sum, created_date,
        armed_forces_info, insured_members, medical_conditions,
        document_type, source_url, validated,
        fund_investment
      } = entry;
      

      const validLapsedStatus = ['Applicable', 'Not Applicable', 'Unknown'];
      let cleanedLapsedStatus = cash_benefit_lapsed_status;
      if (!validLapsedStatus.includes(cash_benefit_lapsed_status)) {
        cleanedLapsedStatus = 'Unknown';
      }
      // ✅ Insert proposer
      // const marital_stat = "Married"  //for now until IDP is updated
      const proposerRes = await client.query(
        `INSERT INTO proposer (
          customer_name, father_name,
          dob, age, sex, nationality, address, city, district, state, pin_code,
          phone_std, phone_number, mobile, email, residential_status, nri_status,
          country_of_residence, qualification, occupation, gst, identity_proof,
          annual_income, income_proof, employment_type, employer_name, designation,
          duty_nature, length_of_service, ckyc_number, pan_number,
          initial_cash_benefit_chosen, marital_status, prev_policy_no, cash_benefit_availed,
          cash_benefit_lapsed_status, term_rider_sum, accident_rider_sum, created_at
        ) VALUES (
          $1, $2, 
          $3, $4, $5, $6, $7, $8, $9, $10, $11, 
          $12, $13, $14, $15, $16, $17, 
          $18, $19, $20, $21,
          $22, $23, $24, $25, $26,
          $27, $28,
          $29, $30, $31, $32, $33, $34,
          $35, $36, $37, $38, NOW()
        ) RETURNING proposer_id`,
        [
          customer_name, father_name,
          formatDate(dob), calculateAge(dob), sex, nationality, address, city, district, state, pin_code,
          phone_std, phone_number, mobile, user_email || email, residential_status, nri_status,
          country_of_residence, qualification, occupation, cleanGST(gst), identity_proof,
          annual_income, income_proof,
          employment_type?.enum || employment_type,
          employer_name, designation, duty_nature, length_of_service, ckyc_number, pan_number,
          initial_cash_benefit_chosen, marital_status, prev_policy_no, cash_benefit_availed,
          cleanedLapsedStatus, term_rider_sum, accident_rider_sum
        ]
      );


      global.proposerId = proposerRes.rows[0].proposer_id;
      console.log('✅ proposerId:', proposerId);
      console.log('✅ proposer inserted');


      //inserting into proposal table
      const proposal = await client.query(
        `INSERT into proposal (
          proposal_number, proposer_id,product_type
        ) VALUES (
         $1,$2,$3) RETURNING proposal_id`,
        [proposal_number, proposerId, product_type]
      );
      global.proposalNumber = proposal_number
      global.proposalId = proposal.rows[0].proposal_id
      console.log(`✅Proposal inserted for ID - ${proposalId}, proposal number ${proposalNumber}`)


      // ✅ Insert insured members and their medical conditions
      for (const member of data.insured_members) {
        const {
          name, memberDob, sex, relationship_with_proposer, photo,
          abha_number, height_cm, weight_kg, gainful_annual_income,
          occupation_details, city, deductible, sum_insured,
          insured_address, is_pep_or_relative, ckyc_number,
          medical_conditions,
        } = member;

        const cleanedValues = [
          proposerId,
          cleanValue(name),
          formatDate(memberDob),
          cleanValue(sex),
          cleanValue(relationship_with_proposer),
          cleanValue(photo),
          cleanValue(abha_number),
          cleanValue(height_cm),
          cleanValue(weight_kg),
          cleanValue(gainful_annual_income),
          cleanValue(occupation_details),
          cleanValue(city),
          cleanValue(deductible),
          cleanValue(sum_insured),
          cleanValue(insured_address),
          cleanValue(is_pep_or_relative),
          cleanValue(ckyc_number),
        ];

        const insuredRes = await client.query(
          `INSERT INTO Insured_member (
           proposer_id,name, dob, sex, relationship_with_proposer, photo,
          abha_number, height_cm, weight_kg, gainful_annual_income,
          occupation_details, city, deductible, sum_insured, insured_address,
          is_pep_or_relative, ckyc_number,created_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,NOW()
        ) RETURNING member_id`,
          cleanedValues
        );
        const memberId = insuredRes.rows[0].member_id;
        console.log(`✅ insured_member inserted: ${name}`);
        members.push(memberId)

        const lifestyle_info = member.lifestyle_info || entry.lifestyle_info;
        if (lifestyle_info) {
          const {
            smoking_status, tobacco_usage, alcohol_consumption,
            hereditary_risk, occupational_risk,
            physical_activity, sleep_hours, diet
          } = lifestyle_info;

          await client.query(
            `INSERT INTO lifestyle_info (
              member_id, smoking_status, tobacco_usage, alcohol_consumption,
              hereditary_risk, occupational_risk,
              physical_activity, sleep_hours, diet, created_at
            ) VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()
            )`,
            [
              memberId, smoking_status, tobacco_usage, alcohol_consumption,
              hereditary_risk, occupational_risk,
              physical_activity, sleep_hours, diet
            ]
          );
          console.log(`✅ lifestyle_info inserted for member ${memberId}`);
        }

        // ✅ Insert previous_insurance
        const previous_insurance = member.previous_insurance || entry.previous_insurance;
        if (previous_insurance) {
          const {
            prev_policy_number, type_of_policy, insurer_name,
            sum_insured, from_date, to_date, negative_status,
            claim_number, claimed_amount, ailment
          } = previous_insurance;

          await client.query(
            `INSERT INTO previous_insurance (
              member_id, proposer_id, prev_policy_number, type_of_policy, insurer_name,
              sum_insured, from_date, to_date, negative_status,
              claim_number, claimed_amount, ailment, created_at
            ) VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW()
            )`,
            [
              memberId, proposerId,
              prev_policy_number, type_of_policy, insurer_name,
              sum_insured, formatDate(from_date), formatDate(to_date), negative_status,
              claim_number, claimed_amount, ailment
            ]
          );
          console.log(`✅ previous_insurance inserted for member ${memberId}`);
        }

        // ✅ Insert armed forces info
        if (armed_forces_info) {
          const { id = null, wing, posting_place, nature_of_duties, is_category_1 } = armed_forces_info;
          await client.query(
            `INSERT INTO armed_forces_info (id,insured_member_id,wing, posting_place, nature_of_duties, is_category_1, created_at)
           VALUES ($1, $2, $3, $4,$5,$6, NOW())`,
            [id, memberId, wing, posting_place, nature_of_duties, is_category_1]
          );
          console.log('✅ armed_forces_info inserted');
        }

        if (medical_conditions && Object.keys(medical_conditions).length > 0) {
          const cleanedConditions = {};

          for (const [key, value] of Object.entries(medical_conditions)) {
            if (key === 'diagnosis_date') {
              cleanedConditions[key] = cleanValue(value);
            } else {
              cleanedConditions[key] = cleanValue(value); // Clean strings, Yes/No, etc.
            }
          }

          // Ensure that only valid DB columns are used
          const conditionKeys = Object.keys(cleanedConditions);
          const columnNames = ['person_id', ...conditionKeys].join(', ');
          const placeholders = ['$1', ...conditionKeys.map((_, i) => `$${i + 2}`)].join(', ');
          const values = [memberId, ...conditionKeys.map(key => cleanedConditions[key])];

          try {
            await client.query(
              `INSERT INTO medical_condition (${columnNames},created_at) VALUES (${placeholders},NOW())`,
              values
            );

            console.log(`✅ medical_condition inserted for member ID: ${memberId}`);


          } catch (err) {
            console.error(`❌ Failed to insert into medical_condition for member ID ${memberId}:`, err.message);
            console.error(err);
          }


          // ✅ Insert document
          if (document_type && source_url) {
            await client.query(
              `INSERT INTO documents (member_id,proposal_number,document_type, source_url, validated,proposer_id,created_at)
           VALUES ($1, $2, $3, $4,$5,$6,NOW())`,
              [memberId, global.proposalNumber, document_type, source_url, validated ?? false, global.proposerId]
            );
            console.log('✅ documents inserted with doc type', document_type);
          }

          // ✅ Insert fund investment
          if (fund_investment) {
            const {
              fund_type, govt_investment, short_term_investment,
              equity_shares_investment, fund_objective
            } = fund_investment;

            await client.query(
              `INSERT INTO fund_investment (
            proposer_id, fund_type, govt_investment, short_term_investment, equity_shares_investment, fund_objective, created_at
           ) VALUES ($1, $2, $3, $4, $5,$6,NOW())`,
              [proposerId, fund_type, govt_investment, short_term_investment, equity_shares_investment, fund_objective]
            );
            console.log('✅ fund_investment inserted');
          }

          // ✅ Insert pin code (deduplicated)
          if (pin_code && city && district && state) {
            await client.query(
              `INSERT INTO pin_codes (pin_code, city, area, state, created_at)
           VALUES ($1, $2, $3, $4,NOW())
           ON CONFLICT (pin_code) DO NOTHING`,
              [pin_code, city, district, state]
            );
            console.log('✅ pin_codes inserted');
          }
        }
      }

      const result = await client.query(
        `UPDATE
      underwriting_requests
    SET
      proposal_no = $1,
      payload_json = $2,
      updated_at = CURRENT_TIMESTAMP,
      status = 'Processed by IDP',
      proposer_id = $3
    WHERE
      request_id = $4 AND email = $5`,
        [proposal_number, data, proposerId, request_id, user_email]
      );
      if (result.rowCount === 1) {
        console.log(`Successfully updated request with ID: ${request_id} for proposerID - ${proposerId}`);
      } else {
        console.log(`Warning: Request with ID ${request_id} not found. No records were updated.`);
      }
    };

    // 🔁 Handle single entry or array
    if (Array.isArray(data)) {
      for (const entry of data) await insertOne(entry);
    } else {
      await insertOne(data);
    }

    await client.query('COMMIT');
    console.log('✅ All data inserted successfully');
  }
  catch (err) {
    await client.query('ROLLBACK');
    const isRequestDeleted = deleteRequestFromUnderwriting(user_email)
    if (isRequestDeleted == true) {
      console.log("Request Deleted for email", user_email)
    }
    console.error('❌ Error during DB insert:', err);
    throw err;
  } finally {
    client.release();
  }
  return { proposer_id: global.proposerId, proposal_no: global.proposalNumber, member_id: members[0] }; // Return the inserted proposer ID (sending only first member now)
}
