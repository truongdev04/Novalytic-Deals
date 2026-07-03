import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// Redis is optional in dev — when unset, rateLimit.ts falls back to
// always-allow limiters instead of throwing at import time.
export const redis = url && token ? new Redis({ url, token }) : null;
