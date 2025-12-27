-- Insert sample job positions
INSERT INTO job_positions (title, location, overview, responsibilities, qualifications, is_active) VALUES
(
  'Human Resources Manager',
  'Port Harcourt',
  'We are looking for an experienced Hiring Manager to lead our recruitment efforts and ensure we attract and retain top talent. This role requires strong organizational skills, sound judgment, and the ability to collaborate with leadership to meet staffing needs.',
  ARRAY[
    'Manage the end-to-end recruitment process from sourcing to onboarding.',
    'Partner with department heads to identify hiring requirements.',
    'Develop and maintain a strong talent pipeline.',
    'Ensure compliance with employment laws and company policies.',
    'Track and report on hiring metrics to improve efficiency.'
  ],
  ARRAY[
    'Bachelor''s degree in HR, Business Administration, or related field.',
    '3+ years of recruitment or HR experience.',
    'Strong communication and decision-making skills.',
    'Proficiency with ATS and HR software.'
  ],
  true
),
(
  'Logistics Manager',
  'Lagos',
  'We are seeking a detail-oriented Logistics Manager to oversee our delivery operations and ensure timely, efficient service across all locations.',
  ARRAY[
    'Coordinate and optimize delivery routes and schedules.',
    'Manage relationships with delivery partners and riders.',
    'Monitor inventory levels and coordinate with suppliers.',
    'Implement systems to track and improve delivery performance.',
    'Ensure compliance with food safety and transportation regulations.'
  ],
  ARRAY[
    'Bachelor''s degree in Logistics, Supply Chain, or related field.',
    '2+ years of logistics or operations experience.',
    'Strong analytical and problem-solving skills.',
    'Experience with logistics software and tracking systems.'
  ],
  true
),
(
  'Dispatch Rider',
  'Multiple Locations',
  'Join our delivery team as a Dispatch Rider and help bring delicious wings to our customers across the city.',
  ARRAY[
    'Deliver orders to customers in a timely and professional manner.',
    'Maintain delivery vehicle in good working condition.',
    'Follow all traffic laws and safety guidelines.',
    'Communicate effectively with customers and dispatch team.',
    'Handle cash and electronic payments accurately.'
  ],
  ARRAY[
    'Valid motorcycle license.',
    'At least 1 year of delivery experience preferred.',
    'Knowledge of local roads and navigation.',
    'Good communication skills.',
    'Own motorcycle is a plus.'
  ],
  true
);
