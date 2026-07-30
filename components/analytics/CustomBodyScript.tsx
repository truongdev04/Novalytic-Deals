import { getCustomScriptsSettings } from "@/lib/data";

export async function CustomBodyScript() {
  const { bodyScript } = await getCustomScriptsSettings();
  if (!bodyScript) return null;

  return <div dangerouslySetInnerHTML={{ __html: bodyScript }} />;
}
