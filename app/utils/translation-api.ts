import type { CS2ItemTranslationByLanguage } from "@ianlucas/cs2-lib";
import { apiUrl } from "~/api-client";

export async function fetchTranslation(language: string) {
  const url = apiUrl(`/translations/${language}.${__TRANSLATION_CHECKSUM__}.json`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as {
    systemTranslationMap: Record<string, string>;
    itemTranslationMap: CS2ItemTranslationByLanguage[string];
  };
}
