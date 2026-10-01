export interface Course {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  tag: string;
  price: number;
  originalPrice?: number;
  duration: string;
  batchSize: string;
  features: string[];
  popular?: boolean;
}

export interface PaymentRecord {
  id?: string | number;
  txnid: string;
  amount: number;
  courseName: string;
  courseId: string;
  studentName: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  payuId?: string;
  payuHash?: string;
  mode?: string;
  bankRefNum?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentRegistration {
  id?: string | number;
  txnid: string;
  fullName: string;
  dob: string;
  address: string;
  aadharCard: string;
  gender: string;
  email: string;
  phone: string;
  pan: string;
  occupation: string;
  submittedAt: string;
}

export interface PayUInitiatePayload {
  courseId: string;
  customAmount?: number;
  studentName: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface PayUFormData {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  service_provider: string;
  udf1: string;
  udf2: string;
  udf3: string;
  udf4: string;
  udf5: string;
  hash: string;
  actionUrl: string;
  isMock?: boolean;
}
