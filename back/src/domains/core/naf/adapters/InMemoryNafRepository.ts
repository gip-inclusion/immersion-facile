import type { NafSectionSuggestion } from "shared";
import type { NafRepository } from "../port/NafRepository";

export class InMemoryNafRepository implements NafRepository {
  async getNafSuggestions(searchText: string): Promise<NafSectionSuggestion[]> {
    return this.nafSuggestions
      .filter((naf) => naf.label.toLowerCase().includes(searchText))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
  // test purpose
  nafSuggestions: NafSectionSuggestion[] = [];
}
