import type { NafSectionSuggestion } from "shared";
import type { NafRepository } from "../port/NafRepository";

export class InMemoryNafRepository implements NafRepository {
  async getAllNafSuggestions(): Promise<NafSectionSuggestion[]> {
    return this.nafSuggestions;
  }
  // test purpose
  nafSuggestions: NafSectionSuggestion[] = [];
}
