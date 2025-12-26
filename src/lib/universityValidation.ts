// Comprehensive university email validation system
// This file contains extensive university domain validation for international use

const universityDomains = {
  // United States
  us: [
    '.edu',
    'harvard.edu',
    'mit.edu',
    'stanford.edu',
    'berkeley.edu',
    'caltech.edu',
    'yale.edu',
    'princeton.edu',
    'columbia.edu',
    'chicago.edu',
    // Add more US universities as needed
  ],
  
  // United Kingdom
  uk: [
    '.ac.uk',
    'ox.ac.uk',
    'cam.ac.uk',
    'imperial.ac.uk',
    'ucl.ac.uk',
    'lse.ac.uk',
    'kcl.ac.uk',
    'manchester.ac.uk',
    'warwick.ac.uk',
    'bristol.ac.uk',
    'dur.ac.uk',
  ],
  
  // Canada
  ca: [
    '.ca',
    'utoronto.ca',
    'mcgill.ca',
    'ubc.ca',
    'queensu.ca',
    'uwaterloo.ca',
    'mcmaster.ca',
    'yorku.ca',
    'sfu.ca',
    'carleton.ca',
  ],
  
  // Australia
  au: [
    '.edu.au',
    'sydney.edu.au',
    'melbourne.edu.au',
    'unsw.edu.au',
    'anu.edu.au',
    'uq.edu.au',
    'monash.edu.au',
    'adelaide.edu.au',
    'uwa.edu.au',
    'uts.edu.au',
  ],
  
  // Germany
  de: [
    '.uni-',
    '.tu-',
    '.fh-',
    '.hs-',
    'uni-muenchen.de',
    'uni-heidelberg.de',
    'uni-berlin.de',
    'tu-berlin.de',
    'rwth-aachen.de',
    'kit.edu',
  ],
  
  // France
  fr: [
    '.edu',
    'sorbonne-universite.fr',
    'ens.fr',
    'polytechnique.edu',
    'sciences-po.fr',
    'insead.edu',
    'hec.fr',
    'essec.edu',
  ],
  
  // Netherlands
  nl: [
    '.nl',
    'uva.nl',
    'vu.nl',
    'tue.nl',
    'tudelft.nl',
    'rug.nl',
    'uu.nl',
    'leiden.edu',
    'tilburguniversity.edu',
  ],
  
  // Singapore
  sg: [
    '.edu.sg',
    'nus.edu.sg',
    'ntu.edu.sg',
    'smu.edu.sg',
    'sutd.edu.sg',
    'sit.edu.sg',
  ],
  
  // New Zealand
  nz: [
    '.ac.nz',
    'auckland.ac.nz',
    'otago.ac.nz',
    'canterbury.ac.nz',
    'victoria.ac.nz',
    'massey.ac.nz',
  ],
  
  // Japan
  jp: [
    '.ac.jp',
    'u-tokyo.ac.jp',
    'kyoto-u.ac.jp',
    'titech.ac.jp',
    'osaka-u.ac.jp',
    'tohoku.ac.jp',
  ],
  
  // South Korea
  kr: [
    '.ac.kr',
    'snu.ac.kr',
    'kaist.ac.kr',
    'postech.ac.kr',
    'yonsei.ac.kr',
  ],
  
  // Common university keywords
  global: [
    'university',
    'college',
    'institute',
    'school',
    'uni.',
    'univ.',
    'student.',
    'campus',
  ]
};

export interface UniversityValidationResult {
  isValid: boolean;
  country?: string;
  domain: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export function validateUniversityEmail(email: string): UniversityValidationResult {
  const normalizedEmail = email.toLowerCase().trim();
  const domain = normalizedEmail.split('@')[1];
  
  if (!domain) {
    return {
      isValid: false,
      domain: '',
      confidence: 'high',
      reason: 'Invalid email format'
    };
  }

  // Check for exact matches in known domains
  for (const [country, domains] of Object.entries(universityDomains)) {
    if (country === 'global') continue;
    
    for (const universityDomain of domains) {
      if (domain === universityDomain || domain.endsWith(universityDomain)) {
        return {
          isValid: true,
          country,
          domain,
          confidence: 'high',
          reason: `Recognized ${country.toUpperCase()} university domain`
        };
      }
    }
  }

  // Check for global university keywords
  for (const keyword of universityDomains.global) {
    if (domain.includes(keyword)) {
      return {
        isValid: true,
        domain,
        confidence: 'medium',
        reason: `Contains university keyword: ${keyword}`
      };
    }
  }

  // Check for common education TLDs
  const educationTlds = ['.edu', '.ac.', '.edu.'];
  for (const tld of educationTlds) {
    if (domain.includes(tld)) {
      return {
        isValid: true,
        domain,
        confidence: 'medium',
        reason: `Contains educational TLD: ${tld}`
      };
    }
  }

  return {
    isValid: false,
    domain,
    confidence: 'high',
    reason: 'Not recognized as a university email domain'
  };
}

export function getUniversityInfo(email: string): { name?: string; country?: string } | null {
  const validation = validateUniversityEmail(email);
  if (!validation.isValid) return null;

  // Simple university name extraction (can be expanded with a proper database)
  const domain = validation.domain;
  const universityMap: Record<string, { name: string; country: string }> = {
    'harvard.edu': { name: 'Harvard University', country: 'United States' },
    'mit.edu': { name: 'Massachusetts Institute of Technology', country: 'United States' },
    'stanford.edu': { name: 'Stanford University', country: 'United States' },
    'ox.ac.uk': { name: 'University of Oxford', country: 'United Kingdom' },
    'cam.ac.uk': { name: 'University of Cambridge', country: 'United Kingdom' },
    'nus.edu.sg': { name: 'National University of Singapore', country: 'Singapore' },
    // Add more mappings as needed
  };

  return universityMap[domain] || null;
}

export function getDomainSuggestions(partialEmail: string): string[] {
  const [localPart] = partialEmail.split('@');
  if (!localPart || partialEmail.includes('@') === false) return [];

  const popularDomains = [
    'student.university.edu',
    'mail.university.edu',
    'alumni.university.edu',
    'university.ac.uk',
    'student.uni.edu',
  ];

  return popularDomains.map(domain => `${localPart}@${domain}`);
}