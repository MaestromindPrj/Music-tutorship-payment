import { neon } from '@neondatabase/serverless';

const databaseUrl = 'postgresql://neondb_owner:npg_NGkLzqJumO14@ep-solitary-sky-b3s3pfnb-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function testConnection() {
  console.log('Connecting to Neon PostgreSQL Cloud...');
  const sql = neon(databaseUrl);
  
  const version = await sql`SELECT version();`;
  console.log('✅ Connection successful!');
  console.log('PostgreSQL version:', version[0].version);

  console.log('Creating tables if they do not exist...');
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      txnid VARCHAR(64) UNIQUE NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      course_id VARCHAR(64) NOT NULL,
      student_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
      payu_id VARCHAR(128),
      payu_hash TEXT,
      mode VARCHAR(64),
      bank_ref_num VARCHAR(128),
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS student_registrations (
      id SERIAL PRIMARY KEY,
      txnid VARCHAR(64) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      dob DATE NOT NULL,
      address TEXT NOT NULL,
      aadhar_card VARCHAR(20) NOT NULL,
      gender VARCHAR(32) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      pan VARCHAR(20) NOT NULL,
      occupation VARCHAR(128) NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `;

  console.log('✅ Tables verified in Neon Cloud DB:', tables.map(t => t.table_name));
}

testConnection().catch(err => {
  console.error('❌ Connection error:', err);
  process.exit(1);
});
