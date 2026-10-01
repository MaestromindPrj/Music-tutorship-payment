import { NextRequest, NextResponse } from 'next/server';
import { getPaymentByTxnId, saveStudentRegistration } from '@/lib/db';
import { StudentRegistration } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      txnid,
      fullName,
      dob,
      address,
      aadharCard,
      gender,
      email,
      phone,
      pan,
      occupation
    } = body;

    if (!txnid) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const payment = await getPaymentByTxnId(txnid);
    if (!payment) {
      return NextResponse.json({ error: 'Associated payment transaction not found' }, { status: 404 });
    }

    // Validate the 9 required fields
    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your Full Name' }, { status: 400 });
    }
    if (!dob) {
      return NextResponse.json({ error: 'Please select your Date of Birth (DOB)' }, { status: 400 });
    }
    if (!address || address.trim().length < 5) {
      return NextResponse.json({ error: 'Please enter your complete Address' }, { status: 400 });
    }
    if (!aadharCard || aadharCard.replace(/\s+/g, '').length < 12) {
      return NextResponse.json({ error: 'Please enter a valid 12-digit Aadhar Card number' }, { status: 400 });
    }
    if (!gender) {
      return NextResponse.json({ error: 'Please select your Gender' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid Mail ID' }, { status: 400 });
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit Phone Number' }, { status: 400 });
    }
    if (!pan || pan.trim().length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-character PAN number' }, { status: 400 });
    }
    if (!occupation || occupation.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter or select your Occupation' }, { status: 400 });
    }

    const cleanedAadhar = aadharCard.replace(/\s+/g, '');
    const cleanedPan = pan.trim().toUpperCase();

    const registrationData: Omit<StudentRegistration, 'id'> = {
      txnid,
      fullName: fullName.trim(),
      dob,
      address: address.trim(),
      aadharCard: cleanedAadhar,
      gender,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      pan: cleanedPan,
      occupation: occupation.trim(),
      submittedAt: new Date().toISOString()
    };

    const saved = await saveStudentRegistration(registrationData);

    return NextResponse.json({
      success: true,
      message: 'Student registration completed successfully',
      registration: saved,
      payment
    });
  } catch (err: any) {
    console.error('Registration submission error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to submit registration details' },
      { status: 500 }
    );
  }
}
