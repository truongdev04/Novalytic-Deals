import { unstable_cache } from "next/cache";
import { purgeTag } from "@/lib/server/cache/purgeTag";
import { prisma, Prisma } from "@/lib/server/db";
import type {
  AffiliateSettings,
  GeneralSettings,
  IntegrationsSettingsView,
} from "@/types";
import type { AdminIntegrationsSettingsInput } from "@/lib/validators/admin/settings";

const GENERAL_KEY = "site_meta";
const INTEGRATIONS_KEY = "integrations";
const AFFILIATE_KEY = "affiliate_defaults";

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  title: "NovalyticDeals",
  description: "Verified coupons and deals for the US & Europe.",
  logoUrl: "",
  faviconUrl: "",
  ogImage: "",
  robotsIndexingEnabled: true,
  sitemapEnabled: true,
};

// Raw persistence shape for integrations — never sent to the client as-is.
interface IntegrationsRaw {
  resendApiKey?: string;
  contactInboxEmail?: string;
  turnstileSecretKey?: string;
  gaId?: string;
  plausibleDomain?: string;
}

async function getIntegrationsRaw(): Promise<IntegrationsRaw> {
  return unstable_cache(
    async () => {
      const row = await prisma.siteSetting.findUnique({ where: { key: INTEGRATIONS_KEY } });
      return (row?.value as unknown as IntegrationsRaw) ?? {};
    },
    ["settings:integrations:raw"],
    { tags: ["settings:integrations"], revalidate: 300 }
  )();
}

export const getGeneralSettings = unstable_cache(
  async (): Promise<GeneralSettings> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: GENERAL_KEY } });
    const stored = (row?.value as unknown as Partial<GeneralSettings>) ?? {};
    return { ...DEFAULT_GENERAL_SETTINGS, ...stored };
  },
  ["settings:general"],
  { tags: ["settings:general"], revalidate: 300 }
);

export async function setGeneralSettings(input: GeneralSettings): Promise<GeneralSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: GENERAL_KEY },
    create: { key: GENERAL_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:general");
  return row.value as unknown as GeneralSettings;
}

function maskSecret(value?: string): string | undefined {
  if (!value) return undefined;
  return `••••${value.slice(-4)}`;
}

export async function getIntegrationsSettingsView(): Promise<IntegrationsSettingsView> {
  const raw = await getIntegrationsRaw();

  const resendConfigured = Boolean(raw.resendApiKey || process.env.RESEND_API_KEY);
  const turnstileConfigured = Boolean(raw.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY);

  return {
    resendApiKey: {
      configured: resendConfigured,
      source: raw.resendApiKey ? "db" : process.env.RESEND_API_KEY ? "env" : "none",
      maskedPreview: maskSecret(raw.resendApiKey),
    },
    contactInboxEmail: raw.contactInboxEmail ?? "",
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
    turnstileSiteKeySource: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? "env" : "none",
    turnstileSecretKey: {
      configured: turnstileConfigured,
      source: raw.turnstileSecretKey ? "db" : process.env.TURNSTILE_SECRET_KEY ? "env" : "none",
      maskedPreview: maskSecret(raw.turnstileSecretKey),
    },
    gaId: raw.gaId ?? "",
    plausibleDomain: raw.plausibleDomain ?? "",
  };
}

export async function setIntegrationsSettings(
  patch: AdminIntegrationsSettingsInput
): Promise<IntegrationsSettingsView> {
  const current = await getIntegrationsRaw();
  const next: IntegrationsRaw = { ...current };

  // Non-secret fields: "" clears (falls back to env), value sets it.
  if (patch.contactInboxEmail !== undefined) {
    next.contactInboxEmail = patch.contactInboxEmail || undefined;
  }
  if (patch.gaId !== undefined) {
    next.gaId = patch.gaId || undefined;
  }
  if (patch.plausibleDomain !== undefined) {
    next.plausibleDomain = patch.plausibleDomain || undefined;
  }

  // Secret fields: blank/omitted = leave unchanged. Only clearFields nulls one out.
  if (patch.resendApiKey) {
    next.resendApiKey = patch.resendApiKey;
  }
  if (patch.turnstileSecretKey) {
    next.turnstileSecretKey = patch.turnstileSecretKey;
  }
  for (const field of patch.clearFields ?? []) {
    delete next[field];
  }

  await prisma.siteSetting.upsert({
    where: { key: INTEGRATIONS_KEY },
    create: { key: INTEGRATIONS_KEY, value: next as unknown as Prisma.InputJsonValue },
    update: { value: next as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:integrations");

  return getIntegrationsSettingsView();
}

export async function getEffectiveResendConfig(): Promise<{ apiKey?: string; fromEmail?: string }> {
  const raw = await getIntegrationsRaw();
  return {
    apiKey: raw.resendApiKey || process.env.RESEND_API_KEY,
    fromEmail: raw.contactInboxEmail || process.env.CONTACT_INBOX_EMAIL,
  };
}

export async function getEffectiveTurnstileConfig(): Promise<{ secretKey?: string }> {
  const raw = await getIntegrationsRaw();
  return { secretKey: raw.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY };
}

export async function getEffectiveAnalyticsConfig(): Promise<{
  gaId?: string;
  plausibleDomain?: string;
}> {
  const raw = await getIntegrationsRaw();
  return {
    gaId: raw.gaId || process.env.NEXT_PUBLIC_GA_ID,
    plausibleDomain: raw.plausibleDomain || process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  };
}

export const getAffiliateSettings = unstable_cache(
  async (): Promise<AffiliateSettings> => {
    const row = await prisma.siteSetting.findUnique({ where: { key: AFFILIATE_KEY } });
    return (row?.value as unknown as AffiliateSettings) ?? {};
  },
  ["settings:affiliate"],
  { tags: ["settings:affiliate"], revalidate: 300 }
);

export async function setAffiliateSettings(input: AffiliateSettings): Promise<AffiliateSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { key: AFFILIATE_KEY },
    create: { key: AFFILIATE_KEY, value: input as unknown as Prisma.InputJsonValue },
    update: { value: input as unknown as Prisma.InputJsonValue },
  });
  purgeTag("settings:affiliate");
  return row.value as unknown as AffiliateSettings;
}

export async function getEffectiveDefaultAffiliateNetwork(): Promise<string | undefined> {
  const settings = await getAffiliateSettings();
  return settings.defaultAffiliateNetwork || process.env.AFFILIATE_DEFAULT_NETWORK;
}
