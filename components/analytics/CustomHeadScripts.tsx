import Script from "next/script";
import { getCustomScriptsSettings } from "@/lib/data";
import { extractInlineScripts } from "@/lib/analytics/extractInlineScripts";

export async function CustomHeadScripts() {
  const { headScript } = await getCustomScriptsSettings();
  if (!headScript) return null;

  const scripts = extractInlineScripts(headScript);

  return (
    <>
      {/* This lint rule only knows the Pages Router's pages/_document.js — root layout.tsx is
          the documented App Router equivalent, confirmed working via a real-browser check: the
          script lands in the live document.head and executes. */}
      {scripts.map((script, index) =>
        script.src ? (
          // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
          <Script
            key={index}
            id={`custom-head-script-${index}`}
            src={script.src}
            strategy="beforeInteractive"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
          <Script key={index} id={`custom-head-script-${index}`} strategy="beforeInteractive">
            {script.code}
          </Script>
        )
      )}
    </>
  );
}
