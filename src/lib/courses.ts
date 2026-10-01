import { Course } from '@/types';

export const COURSES: Course[] = [
  {
    id: 'mastery',
    title: 'Complete Music Production Mastery Course',
    subtitle: 'From Beginner to Advanced',
    tag: '01 / FOUNDATION',
    badge: 'MOST ENROLLED',
    price: 1,
    originalPrice: 49999,
    duration: '12 Months Intensive Program',
    batchSize: '25 Students per Batch',
    features: [
      'Comprehensive Music Theory & Song Structure',
      'Logic Pro X & Ableton Live Deep Dive',
      'Advanced Audio Mixing & Sound Design',
      'Industry Standard Mastering Workflows',
      'Weekly Live Mentorship Sessions',
      'Certificate of Completion & Portfolio Review',
      'Lifetime Access to Exclusive Alumni Network'
    ]
  },
  {
    id: 'bootcamp',
    title: 'Producer Transformation Path',
    subtitle: 'From Intermediate to Advanced',
    tag: '02 / INTENSIVE',
    badge: 'POPULAR CHOICE',
    popular: true,
    price: 34999,
    originalPrice: 48000,
    duration: '4 Months Intensive',
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
    id: 'mentorship',
    title: '1-on-1 Music Production Mentorship',
    subtitle: 'Personalized Learning Experience',
    tag: '03 / PERSONALIZED',
    badge: 'PREMIUM TIER',
    price: 59999,
    originalPrice: 75000,
    duration: 'Customized / Flexible Schedule',
    batchSize: 'Private 1-on-1 Individual',
    features: [
      '100% Tailored Curriculum to Your Musical Goals',
      'Flexible Session Timings (Weekdays / Weekends)',
      'Dedicated 1-on-1 Studio Mentorship Sessions',
      'Complete Co-Production on Your Original Tracks',
      'Vocal Tuning, Mixing Stems, & Master File Polish',
      'Industry Networking & Artist Career Roadmap',
      'Unlimited Project Reviews & Direct Hotline Support'
    ]
  }
];

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id) || COURSES[0];
}
