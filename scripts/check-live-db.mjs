import { neon } from '@neondatabase/serverless';

const databaseUrl = 'postgresql://neondb_owner:npg_NGkLzqJumO14@ep-solitary-sky-b3s3pfnb-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function checkCloudData() {
  const sql = neon(databaseUrl);
  
  const paymentCount = await sql`SELECT COUNT(*) FROM payments;`;
  const regCount = await sql`SELECT COUNT(*) FROM student_registrations;`;
  
  console.log('--- NEON CLOUD LIVE DATABASE STATUS ---');
  console.log('Total Payments in Neon Cloud:', paymentCount[0].count);
  console.log('Total Student Registrations in Neon Cloud:', regCount[0].count);
  
  const payments = await sql`SELECT txnid, student_name, amount, status, created_at FROM payments ORDER BY created_at DESC LIMIT 5;`;
  console.log('\nRecent Payments:', payments);

  const regs = await sql`SELECT txnid, full_name, email, phone, aadhar_card, pan, occupation FROM student_registrations ORDER BY submitted_at DESC LIMIT 5;`;
  console.log('\nRecent Registrations (KYC):', regs);
}

checkCloudData().catch(console.error);
