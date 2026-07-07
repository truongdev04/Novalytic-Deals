export interface GeneralSettings {
  title: string;
  description: string;
  logoUrl?: string;
  faviconUrl?: string;
  ogImage?: string;
  robotsIndexingEnabled: boolean;
  sitemapEnabled: boolean;
}

export interface AffiliateSettings {
  defaultAffiliateNetwork?: string;
}

export type RedirectType = "PERMANENT" | "TEMPORARY";

export interface RedirectRule {
  id: string;
  source: string;
  destination: string;
  type: RedirectType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = "ADMIN" | "EDITOR";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
}

export type SecretFieldSource = "db" | "env" | "none";

export interface SecretFieldView {
  configured: boolean;
  source: SecretFieldSource;
  maskedPreview?: string;
}

export interface IntegrationsSettingsView {
  resendApiKey: SecretFieldView;
  contactInboxEmail?: string;
  turnstileSiteKey?: string;
  turnstileSiteKeySource: "env" | "none";
  turnstileSecretKey: SecretFieldView;
  gaId?: string;
  plausibleDomain?: string;
}
