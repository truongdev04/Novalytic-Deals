#!/usr/bin/env node
// Canary đo hiệu quả dedup ISR của Vercel.
//
// Vercel chỉ tính Write Unit khi nội dung regenerate KHÁC bản đang cache
// ("When revalidation runs and the content hasn't changed from the previous
// version, no ISR write units are incurred"). Nên metric cần theo dõi không
// phải "regenerate ít đi" mà là "regenerate ra byte GIỐNG HỆT".
//
// Script poll từng URL, phát hiện thời điểm Vercel ghi cache entry mới (header
// `age` tụt xuống), rồi so sha256 body trước/sau. Tỉ lệ STABLE càng cao càng tốt.
//
//   node scripts/isr-diff.mjs --minutes 15 https://novalyticdeals.com/ /stores/a
//
// Path tương đối được ghép vào --base (mặc định https://novalyticdeals.com).

import { createHash } from "node:crypto";

const DEFAULTS = { minutes: 15, interval: 20, base: "https://novalyticdeals.com" };

function parseArgs(argv) {
  const opts = { ...DEFAULTS, urls: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--minutes" || arg === "--interval" || arg === "--base") {
      const value = argv[++i];
      if (value === undefined) throw new Error(`Thiếu giá trị cho ${arg}`);
      opts[arg.slice(2)] = arg === "--base" ? value : Number(value);
      continue;
    }
    opts.urls.push(arg);
  }
  if (opts.urls.length === 0) throw new Error("Cần ít nhất một URL hoặc path.");
  opts.urls = opts.urls.map((u) => new URL(u, opts.base).toString());
  return opts;
}

const sha = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 12);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "isr-diff-canary" },
    cache: "no-store",
  });
  const body = Buffer.from(await res.arrayBuffer());
  return {
    age: Number(res.headers.get("age") ?? -1),
    cache: res.headers.get("x-vercel-cache") ?? "?",
    sha: sha(body),
    size: body.length,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const rounds = Math.max(1, Math.round((opts.minutes * 60) / opts.interval));
  // Mỗi lần ghi cache tốn ceil(bytes / 8192) Write Unit — dùng để quy đổi ra
  // chi phí thực tế thay vì chỉ đếm số lần.
  const units = (bytes) => Math.ceil(bytes / 8192);

  const state = new Map(
    opts.urls.map((url) => [url, { prev: null, stable: 0, changed: 0, wastedUnits: 0 }])
  );

  console.log(
    `Poll ${opts.urls.length} URL mỗi ${opts.interval}s trong ${opts.minutes} phút ` +
      `(${rounds} vòng).\n`
  );

  for (let round = 0; round < rounds; round++) {
    for (const url of opts.urls) {
      const s = state.get(url);
      let now;
      try {
        now = await probe(url);
      } catch (err) {
        console.log(`${new Date().toISOString()}  ${url}  LỖI: ${err.message}`);
        continue;
      }

      // `age` tụt xuống nghĩa là CDN đang phục vụ một cache entry mới —
      // tức vừa có một lần regenerate kể từ lần poll trước.
      if (s.prev && now.age < s.prev.age) {
        const same = now.sha === s.prev.sha;
        if (same) s.stable++;
        else {
          s.changed++;
          s.wastedUnits += units(now.size);
        }
        const label = same ? "STABLE (miễn phí)" : `CHANGED (~${units(now.size)} units)`;
        console.log(
          `${new Date().toISOString()}  ${url}\n` +
            `    regenerate: ${s.prev.sha} -> ${now.sha}  ${s.prev.size}B -> ${now.size}B  ${label}`
        );
      }
      s.prev = now;
    }
    if (round < rounds - 1) await sleep(opts.interval * 1000);
  }

  console.log("\n=== Tổng kết ===");
  let totalStable = 0;
  let totalChanged = 0;
  let totalWasted = 0;
  for (const [url, s] of state) {
    const seen = s.stable + s.changed;
    totalStable += s.stable;
    totalChanged += s.changed;
    totalWasted += s.wastedUnits;
    const pct = seen ? ((s.stable / seen) * 100).toFixed(0) : "-";
    console.log(
      `  ${url}\n` +
        `    regenerate: ${seen}  |  stable: ${s.stable} (${pct}%)  |  ` +
        `changed: ${s.changed}  |  lãng phí ~${s.wastedUnits} write units`
    );
  }
  const seen = totalStable + totalChanged;
  if (seen === 0) {
    console.log("\n  Chưa bắt được lần regenerate nào — tăng --minutes.");
    return;
  }
  const pct = (totalStable / seen) * 100;
  console.log(
    `\n  TỔNG: ${pct.toFixed(1)}% regenerate ra byte giống hệt ` +
      `(mục tiêu >= 95%), lãng phí ~${totalWasted} write units trong ${opts.minutes} phút.`
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
