import { Course } from '@/types';
import { getPricing } from './pricing';

export function getCourses(): Course[] {
  const pricing = getPricing();
  return [
    {
      id: 'producer-transformation',
      title: 'Producer Transformation Path',
      subtitle: 'From Intermediate to Advanced',
      tag: '01 / INTENSIVE PROGRAM',
      badge: 'ENROLLING NOW',
      popular: true,
      disabled: false,
      price: pricing.coursePrice,
      originalPrice: pricing.courseOriginalPrice,
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
      title: 'Discovery Call',
      tag: '02 / STRATEGY SESSION',
      badge: 'CALENDLY BOOKING',
      popular: false,
      disabled: false,
      price: pricing.consultationPrice,
      duration: '60 Minutes Live Session',
      batchSize: 'Private 1-on-1 Call',
      features: [
        'Schedule immediately via Calendly upon payment.',
        `If you decide to join the Producer Transformation Path, the ${pricing.creditText} Discovery Call fee will be deducted from the course fee.`
      ]
    }
  ];
}

export const COURSES: Course[] = getCourses();

export function getCourseById(id: string): Course | undefined {
  const courses = getCourses();
  if (id === 'bootcamp' || id === 'producer-transformation') {
    return courses[0];
  }
  return courses.find((c) => c.id === id) || courses[0];
}
