import type { NafSectionSuggestion } from "shared";

export type NafRepository = {
  getAllNafSuggestions(): Promise<NafSectionSuggestion[]>;
};
