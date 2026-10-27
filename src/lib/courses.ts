import { Course } from '@/types';

export const COURSES: Course[] = [
  {
    id: 'producer-transformation',
    title: 'Producer Transformation Path',
    subtitle: 'From Intermediate to Advanced',
    tag: '01 / INTENSIVE PROGRAM',
    badge: 'ENROLLING NOW',
    popular: true,
    disabled: false,
    price: 159000,
    originalPrice: 170000,
    duration: '4 Months Intensive (Hybrid)',
    batchSize: '13 Students per Batch',
    features: [
      '1 Official Commercial Song Release Guaranteed',
      'Signature Sound Synthesis & Beat Making',
      'Vocal Processing & Layering Mastery',
      'Arrangement Strategies for Hit Records',
      'Direct Weekly Feedback on Your Projects',
      'Release Strategy, Distribution & Streaming Guidance',
      'Direct WhatsApp Mentorship Access'
    ]
  },
  {
    id: 'call-consultation',
    title: 'Call Consultation',
    subtitle: '1-on-1 Strategy & Mentorship Session',
    tag: '02 / STRATEGY SESSION',
    badge: 'CALENDLY BOOKING',
    popular: false,
    disabled: false,
    price: 1,
    duration: '60 Minutes Live Session',
    batchSize: 'Private 1-on-1 Call',
    features: [
      'Schedule immediately via Calendly upon payment.',
      'If you decide to join the Producer Transformation Path, the ₹10,000 consultation fee will be deducted from the course fee.'
    ]
  }
];

export function getCourseById(id: string): Course | undefined {
  if (id === 'bootcamp' || id === 'producer-transformation') {
    return COURSES[0];
  }
  return COURSES.find((c) => c.id === id) || COURSES[0];
}
