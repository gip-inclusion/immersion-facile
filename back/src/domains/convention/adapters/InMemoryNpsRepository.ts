import type { ValidatedConventionNps } from "../entities/ValidatedConventionNps";
import type { NpsRepository } from "../ports/NpsRepository";

export class InMemoryNpsRepository implements NpsRepository {
  #nps: ValidatedConventionNps[] = [];
  async save(nps: ValidatedConventionNps): Promise<void> {
    this.#nps.push(nps);
  }

  get nps() {
    return this.#nps;
  }
}
