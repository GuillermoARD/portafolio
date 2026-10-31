export interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  imageUrl: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  sortOrder: number;
}

export type SkillLogoData =
  | { type: 'brand'; slug: string; title: string; hex: string; path: string }
  | { type: 'image'; url: string };

export interface Skill {
  name: string;
  logo: SkillLogoData | null;
}

export interface SkillGroup {
  id: number;
  title: string;
  icon: string;
  skills: Skill[];
  sortOrder: number;
}

export interface Certificate {
  id: number;
  title: string;
  issuer: string;
  issuedAt: string | null;
  imageUrl: string;
  credentialUrl: string | null;
  sortOrder: number;
}

export type FieldErrors = Record<string, string>;

export type ApiResult<T> = ({ ok: true } & T) | { ok: false; error: string; fieldErrors?: FieldErrors; status?: number };
