import { getCustomScriptsSettings } from "@/lib/data";

export async function CustomFooterScript() {
  const { footerScript } = await getCustomScriptsSettings();
  if (!footerScript) return null;

  return <div dangerouslySetInnerHTML={{ __html: footerScript }} />;
}
