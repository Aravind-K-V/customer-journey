import pool from './db/pool.js';

export async function deleteRequestFromUnderwriting(user_email){
      const client = await pool.connect()
try{
      const deleteQuery = `
        DELETE FROM underwriting_requests
        WHERE email = $1
        RETURNING *;
      `;

      const { rows } = await client.query(deleteQuery, [user_email]);

      if (rows.length > 0) {
                console.log('Deleted record:', rows[0]);

        return true
      } else {
        console.log('No record found with that email');
      }
      return false
}catch(err){
    console.log("DELETION ERROR",err)
}
}