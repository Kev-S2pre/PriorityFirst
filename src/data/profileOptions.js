/**
 * Profile options: institution types and the department / course / program lists
 * that depend on them. Programs follow CHED-recognized degree titles and DepEd SHS tracks.
 */

export const INSTITUTION_TYPES = [
  { value: 'school', label: 'School (College / University)', departmentLabel: 'Course / Program' },
  { value: 'company', label: 'Company / Business', departmentLabel: 'Department' },
  { value: 'government', label: 'Government Agency', departmentLabel: 'Division / Office' },
  { value: 'organization', label: 'Organization / Non-profit', departmentLabel: 'Unit / Committee' }
];

// Athletes pick their sport instead of a department
export const ATHLETE_DEPARTMENT_LABEL = 'Sport';

export const SCHOOL_PROGRAMS = [
  {
    group: 'Senior High School (DepEd)',
    options: [
      'SHS – Academic: Accountancy, Business and Management (ABM)',
      'SHS – Academic: Humanities and Social Sciences (HUMSS)',
      'SHS – Academic: Science, Technology, Engineering and Mathematics (STEM)',
      'SHS – Academic: General Academic Strand (GAS)',
      'SHS – TVL: Information and Communications Technology (ICT)',
      'SHS – TVL: Home Economics (HE)',
      'SHS – TVL: Industrial Arts (IA)',
      'SHS – TVL: Agri-Fishery Arts (AFA)',
      'SHS – Arts and Design Track',
      'SHS – Sports Track'
    ]
  },
  {
    group: 'Information Technology & Computing',
    options: [
      'Bachelor of Science in Information Technology (BSIT)',
      'Bachelor of Science in Computer Science (BSCS)',
      'Bachelor of Science in Information Systems (BSIS)',
      'Bachelor of Science in Entertainment and Multimedia Computing (BSEMC)',
      'Bachelor of Science in Computer Engineering (BSCpE)',
      'Bachelor of Library and Information Science (BLIS)',
      'Associate in Computer Technology (ACT)'
    ]
  },
  {
    group: 'Engineering',
    options: [
      'Bachelor of Science in Civil Engineering (BSCE)',
      'Bachelor of Science in Mechanical Engineering (BSME)',
      'Bachelor of Science in Electrical Engineering (BSEE)',
      'Bachelor of Science in Electronics Engineering (BSECE)',
      'Bachelor of Science in Chemical Engineering (BSChE)',
      'Bachelor of Science in Industrial Engineering (BSIE)',
      'Bachelor of Science in Geodetic Engineering (BSGE)',
      'Bachelor of Science in Agricultural and Biosystems Engineering (BSABE)',
      'Bachelor of Science in Mining Engineering (BSEM)',
      'Bachelor of Science in Metallurgical Engineering (BSMetE)',
      'Bachelor of Science in Geological Engineering (BSGeoE)',
      'Bachelor of Science in Petroleum Engineering (BSPetE)',
      'Bachelor of Science in Materials Engineering (BSMatE)',
      'Bachelor of Science in Aeronautical Engineering (BSAeroE)',
      'Bachelor of Science in Marine Engineering (BSMarE)',
      'Bachelor of Science in Naval Architecture and Marine Engineering (BSNAME)',
      'Bachelor of Science in Sanitary Engineering (BSSE)',
      'Bachelor of Science in Ceramic Engineering (BSCerE)',
      'Bachelor of Science in Manufacturing Engineering (BSMfgE)',
      'Bachelor of Science in Mechatronics Engineering',
      'Bachelor of Science in Instrumentation and Control Engineering',
      'Bachelor of Science in Environmental and Sanitary Engineering'
    ]
  },
  {
    group: 'Architecture & Design',
    options: [
      'Bachelor of Science in Architecture (BS Arch)',
      'Bachelor of Science in Interior Design (BSID)',
      'Bachelor of Landscape Architecture (BLA)',
      'Bachelor of Fine Arts (BFA)',
      'Bachelor of Multimedia Arts (BMMA)',
      'Bachelor of Science in Fashion Design and Merchandising'
    ]
  },
  {
    group: 'Business & Accountancy',
    options: [
      'Bachelor of Science in Accountancy (BSA)',
      'Bachelor of Science in Management Accounting (BSMA)',
      'Bachelor of Science in Accounting Information System (BSAIS)',
      'Bachelor of Science in Internal Auditing (BSIA)',
      'Bachelor of Science in Business Administration – Marketing Management',
      'Bachelor of Science in Business Administration – Financial Management',
      'Bachelor of Science in Business Administration – Human Resource Management',
      'Bachelor of Science in Business Administration – Operations Management',
      'Bachelor of Science in Business Administration – Business Economics',
      'Bachelor of Science in Entrepreneurship (BS Entrep)',
      'Bachelor of Science in Office Administration (BSOA)',
      'Bachelor of Science in Real Estate Management (BSREM)',
      'Bachelor of Science in Legal Management (BSLM)',
      'Bachelor of Science in Customs Administration (BSCA)',
      'Bachelor of Science in Agribusiness Management',
      'Bachelor of Science in Retail Technology and Consumer Science'
    ]
  },
  {
    group: 'Hospitality & Tourism',
    options: [
      'Bachelor of Science in Hospitality Management (BSHM)',
      'Bachelor of Science in Tourism Management (BSTM)',
      'Bachelor of Science in Culinary Management',
      'Bachelor of Science in Hotel and Restaurant Management (BSHRM)'
    ]
  },
  {
    group: 'Health & Allied Medical Sciences',
    options: [
      'Bachelor of Science in Nursing (BSN)',
      'Bachelor of Science in Pharmacy (BS Pharma)',
      'Bachelor of Science in Clinical Pharmacy',
      'Bachelor of Science in Medical Technology / Medical Laboratory Science (BSMT)',
      'Bachelor of Science in Radiologic Technology (BSRT)',
      'Bachelor of Science in Physical Therapy (BSPT)',
      'Bachelor of Science in Occupational Therapy (BSOT)',
      'Bachelor of Science in Respiratory Therapy (BSRT-Resp)',
      'Bachelor of Science in Speech-Language Pathology',
      'Bachelor of Science in Midwifery (BSM)',
      'Bachelor of Science in Nutrition and Dietetics (BSND)',
      'Bachelor of Science in Public Health (BSPH)',
      'Bachelor of Science in Optometry / Doctor of Optometry (OD)',
      'Doctor of Dental Medicine (DMD)',
      'Doctor of Medicine (MD)',
      'Doctor of Veterinary Medicine (DVM)',
      'Diploma in Midwifery'
    ]
  },
  {
    group: 'Education',
    options: [
      'Bachelor of Elementary Education (BEEd)',
      'Bachelor of Secondary Education – English (BSEd)',
      'Bachelor of Secondary Education – Filipino (BSEd)',
      'Bachelor of Secondary Education – Mathematics (BSEd)',
      'Bachelor of Secondary Education – Science (BSEd)',
      'Bachelor of Secondary Education – Social Studies (BSEd)',
      'Bachelor of Secondary Education – Values Education (BSEd)',
      'Bachelor of Early Childhood Education (BECEd)',
      'Bachelor of Special Needs Education (BSNEd)',
      'Bachelor of Physical Education (BPEd)',
      'Bachelor of Technology and Livelihood Education (BTLEd)',
      'Bachelor of Technical-Vocational Teacher Education (BTVTEd)',
      'Bachelor of Culture and Arts Education (BCAEd)',
      'Certificate in Teaching Program (CTP)'
    ]
  },
  {
    group: 'Arts, Humanities & Communication',
    options: [
      'Bachelor of Arts in Communication (AB Comm)',
      'Bachelor of Arts in Journalism (AB Journ)',
      'Bachelor of Arts in Broadcasting',
      'Bachelor of Arts in English Language Studies (ABELS)',
      'Bachelor of Arts in Filipino (AB Filipino)',
      'Bachelor of Arts in Literature',
      'Bachelor of Arts in History (AB History)',
      'Bachelor of Arts in Philosophy (AB Philo)',
      'Bachelor of Arts in Theology / Religious Studies',
      'Bachelor of Arts in Political Science (AB PolSci)',
      'Bachelor of Arts in Economics (AB Econ)',
      'Bachelor of Arts in Sociology',
      'Bachelor of Arts in Anthropology',
      'Bachelor of Arts in International Studies',
      'Bachelor of Arts in Development Studies',
      'Bachelor of Arts in Linguistics',
      'Bachelor of Music (BM)',
      'Bachelor of Performing Arts (Theater / Dance)'
    ]
  },
  {
    group: 'Social & Behavioral Sciences',
    options: [
      'Bachelor of Science in Psychology (BS Psych)',
      'Bachelor of Arts in Psychology (AB Psych)',
      'Bachelor of Science in Social Work (BSSW)',
      'Bachelor of Science in Community Development',
      'Bachelor of Public Administration (BPA)',
      'Bachelor of Science in Criminology (BS Crim)',
      'Bachelor of Science in Industrial Security Management',
      'Bachelor of Science in Foreign Service (BSFS)',
      'Juris Doctor / Bachelor of Laws (JD / LLB)'
    ]
  },
  {
    group: 'Natural Sciences & Mathematics',
    options: [
      'Bachelor of Science in Biology (BS Bio)',
      'Bachelor of Science in Chemistry (BS Chem)',
      'Bachelor of Science in Physics',
      'Bachelor of Science in Applied Physics',
      'Bachelor of Science in Mathematics (BS Math)',
      'Bachelor of Science in Applied Mathematics',
      'Bachelor of Science in Statistics',
      'Bachelor of Science in Environmental Science (BSES)',
      'Bachelor of Science in Geology',
      'Bachelor of Science in Marine Biology',
      'Bachelor of Science in Biochemistry',
      'Bachelor of Science in Microbiology',
      'Bachelor of Science in Molecular Biology and Biotechnology',
      'Bachelor of Science in Meteorology',
      'Bachelor of Science in Food Technology',
      'Bachelor of Science in Food Science'
    ]
  },
  {
    group: 'Agriculture, Fisheries & Forestry',
    options: [
      'Bachelor of Science in Agriculture (BSA)',
      'Bachelor of Science in Agricultural Technology',
      'Bachelor of Science in Agroforestry',
      'Bachelor of Science in Forestry (BSF)',
      'Bachelor of Science in Fisheries (BSFi)',
      'Bachelor of Science in Animal Science',
      'Bachelor of Science in Horticulture',
      'Bachelor of Science in Agricultural Economics'
    ]
  },
  {
    group: 'Maritime & Aviation',
    options: [
      'Bachelor of Science in Marine Transportation (BSMT)',
      'Bachelor of Science in Marine Engineering (BSMarE)',
      'Bachelor of Science in Aircraft Maintenance Technology (BSAMT)',
      'Bachelor of Science in Aviation (Flying)',
      'Bachelor of Science in Air Transportation',
      'Bachelor of Science in Aviation Electronics Technology'
    ]
  },
  {
    group: 'Industrial Technology',
    options: [
      'Bachelor of Science in Industrial Technology (BSIndTech)',
      'Bachelor of Engineering Technology (BET)',
      'Bachelor of Science in Electrical Technology',
      'Bachelor of Science in Electronics Technology',
      'Bachelor of Science in Mechanical Technology',
      'Bachelor of Science in Automotive Technology',
      'Bachelor of Science in Computer Technology',
      'Bachelor of Science in Drafting Technology',
      'Bachelor of Science in Garment Technology',
      'Bachelor of Science in Hotel and Restaurant Technology',
      'Bachelor of Science in Sports Science',
      'Bachelor of Science in Exercise and Sports Sciences'
    ]
  },
  {
    group: 'Graduate Studies',
    options: [
      'Master of Business Administration (MBA)',
      'Master of Arts in Education (MAEd)',
      'Master of Science in Information Technology (MSIT)',
      'Master of Science in Computer Science (MSCS)',
      'Master of Engineering (MEng)',
      'Master in Public Administration (MPA)',
      'Master of Arts in Nursing (MAN)',
      'Master of Science (Other field)',
      'Master of Arts (Other field)',
      'Doctor of Philosophy (PhD)',
      'Doctor of Education (EdD)'
    ]
  },
  {
    group: 'Technical-Vocational (TESDA)',
    options: [
      'TESDA National Certificate (NC) Program',
      'Two-year Associate / Diploma Program'
    ]
  }
];

export const COMPANY_DEPARTMENTS = [
  {
    group: 'Business Functions',
    options: [
      'Executive / Management',
      'Administration',
      'Human Resources (HR)',
      'Finance',
      'Accounting',
      'Audit',
      'Legal & Compliance',
      'Procurement / Purchasing',
      'Sales',
      'Marketing',
      'Business Development',
      'Public Relations / Communications'
    ]
  },
  {
    group: 'Operations & Technical',
    options: [
      'Operations',
      'Information Technology (IT)',
      'Software Development / Engineering',
      'Data & Analytics',
      'Cybersecurity',
      'Research & Development (R&D)',
      'Engineering',
      'Production / Manufacturing',
      'Quality Assurance / Quality Control',
      'Logistics & Supply Chain',
      'Warehouse & Inventory',
      'Facilities & Maintenance',
      'Health, Safety & Environment (HSE)'
    ]
  },
  {
    group: 'Customer-Facing',
    options: [
      'Customer Service / Support',
      'BPO / Call Center Operations',
      'Technical Support',
      'Retail / Store Operations',
      'Food & Beverage Service',
      'Front Office / Reception'
    ]
  },
  {
    group: 'Specialized',
    options: [
      'Design / Creative',
      'Content & Media',
      'Training & Development',
      'Healthcare / Clinical',
      'Security',
      'Internship / On-the-Job Training (OJT)'
    ]
  }
];

export const GOVERNMENT_DIVISIONS = [
  {
    group: 'Divisions & Offices',
    options: [
      'Office of the Head of Agency',
      'Administrative Division',
      'Human Resource Management Division',
      'Finance / Budget Division',
      'Accounting Division',
      'Legal Division',
      'Planning and Development Division',
      'Information and Communications Technology (ICT) Division',
      'Records Management Division',
      'Procurement / Bids and Awards (BAC)',
      'Public Information Office',
      'Internal Audit Service',
      'Operations / Technical Division',
      'Field / Regional Office',
      'Frontline Services / Public Assistance',
      'Research and Statistics Division',
      'Training Division'
    ]
  },
  {
    group: 'Local Government',
    options: [
      "Mayor's / Governor's Office",
      'Sangguniang Panlalawigan / Panlungsod / Bayan',
      "Treasurer's Office",
      "Assessor's Office",
      'Municipal / City Health Office',
      'Social Welfare and Development Office',
      'Engineering Office',
      'Disaster Risk Reduction and Management Office (DRRMO)',
      'Barangay Office'
    ]
  }
];

export const ORGANIZATION_UNITS = [
  {
    group: 'Units & Committees',
    options: [
      'Executive Board / Officers',
      'Secretariat',
      'Finance / Treasury',
      'Membership',
      'Events & Programs',
      'Communications / Publicity',
      'Creatives / Multimedia',
      'Logistics',
      'Community Outreach / Extension',
      'Fundraising',
      'Training & Development',
      'Research & Advocacy',
      'Volunteers',
      'Ministry / Religious Service',
      'General Member'
    ]
  }
];

export const SPORTS = [
  {
    group: 'Team Sports',
    options: ['Basketball', 'Volleyball', 'Beach Volleyball', 'Football (Soccer)', 'Futsal', 'Baseball', 'Softball', 'Sepak Takraw', 'Rugby', 'Ultimate Frisbee', 'Cheerdance', 'Dragon Boat']
  },
  {
    group: 'Individual Sports',
    options: ['Athletics (Track and Field)', 'Swimming', 'Badminton', 'Table Tennis', 'Tennis', 'Chess', 'Boxing', 'Taekwondo', 'Karate', 'Judo', 'Arnis', 'Wushu', 'Wrestling', 'Fencing', 'Archery', 'Gymnastics', 'Weightlifting', 'Cycling', 'Golf', 'Billiards', 'Bowling', 'Dancesport', 'Triathlon', 'Skateboarding', 'Surfing']
  },
  {
    group: 'Esports',
    options: ['Esports (Mobile Legends, Valorant, etc.)']
  }
];

const DEPARTMENT_LISTS = {
  school: SCHOOL_PROGRAMS,
  company: COMPANY_DEPARTMENTS,
  government: GOVERNMENT_DIVISIONS,
  organization: ORGANIZATION_UNITS
};

/**
 * The grouped option list for the Department field.
 * Athletes choose a sport whatever their institution type.
 */
export function getDepartmentOptions(institutionType, classification) {
  if (classification === 'Athlete') return SPORTS;
  return DEPARTMENT_LISTS[institutionType] || [];
}

export function getDepartmentLabel(institutionType, classification) {
  if (classification === 'Athlete') return ATHLETE_DEPARTMENT_LABEL;
  return INSTITUTION_TYPES.find(t => t.value === institutionType)?.departmentLabel || 'Department';
}

export function isValidDepartment(department, institutionType, classification) {
  if (!department) return true;
  return getDepartmentOptions(institutionType, classification)
    .some(group => group.options.includes(department));
}

// Default institution type for each classification
export function defaultInstitutionType(classification) {
  if (classification === 'Student') return 'school';
  if (classification === 'Professional' || classification === 'Worker') return 'company';
  if (classification === 'Athlete') return 'school';
  return '';
}
