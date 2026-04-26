/**
 * Section content TypeScript interfaces for each SectionType enum value.
 * These define the expected jsonb shape stored in cv_sections.content column.
 * Frontend and backend both validate against these shapes.
 */

export interface PersonalInfoContent {
  fullName: string;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  summary: string | null;
}

export interface ExperienceItem {
  jobTitle: string;
  company: string;
  location: string | null;
  startDate: string; // YYYY-MM
  endDate: string | null; // YYYY-MM
  isCurrent: boolean;
  description: string | null;
  highlights: string[];
}

export interface ExperienceContent {
  experiences: ExperienceItem[];
}

export interface EducationItem {
  school: string;
  degree: string;
  fieldOfStudy: string | null;
  location: string | null;
  startDate: string; // YYYY-MM
  endDate: string | null; // YYYY-MM
  isCurrent: boolean;
  grade: string | null;
  description: string | null;
}

export interface EducationContent {
  educations: EducationItem[];
}

export interface SkillItem {
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | null;
}

export interface SkillGroup {
  name: string;
  skills: SkillItem[];
}

export interface SkillsContent {
  skillGroups: SkillGroup[];
}

export interface ProjectItem {
  name: string;
  role: string | null;
  summary: string | null;
  startDate: string | null; // YYYY-MM
  endDate: string | null; // YYYY-MM
  isCurrent: boolean;
  url: string | null;
  repoUrl: string | null;
  technologies: string[];
  highlights: string[];
}

export interface ProjectsContent {
  projects: ProjectItem[];
}

export interface LanguageItem {
  name: string;
  proficiency: 'NATIVE' | 'FLUENT' | 'PROFESSIONAL' | 'INTERMEDIATE' | 'BASIC';
  certificate: string | null;
}

export interface LanguagesContent {
  languages: LanguageItem[];
}

export interface CertificationItem {
  name: string;
  issuer: string;
  issueDate: string | null; // YYYY-MM
  expirationDate: string | null; // YYYY-MM
  credentialId: string | null;
  credentialUrl: string | null;
  description: string | null;
}

export interface CertificationsContent {
  certifications: CertificationItem[];
}

export interface CustomEntry {
  heading: string;
  value: string;
  bullets: string[];
}

export interface CustomContent {
  title: string;
  entries: CustomEntry[];
}

export type SectionContentUnion =
  | PersonalInfoContent
  | ExperienceContent
  | EducationContent
  | SkillsContent
  | ProjectsContent
  | LanguagesContent
  | CertificationsContent
  | CustomContent;
