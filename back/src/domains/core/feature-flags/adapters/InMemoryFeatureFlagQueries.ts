import type { FeatureFlags } from "shared";
import type { FeatureFlagQueries } from "../ports/FeatureFlagQueries";
import type { InMemoryFeatureFlagRepository } from "./InMemoryFeatureFlagRepository";

export class InMemoryFeatureFlagQueries implements FeatureFlagQueries {
  #repo: InMemoryFeatureFlagRepository;

  constructor(repo: InMemoryFeatureFlagRepository) {
    this.#repo = repo;
  }

  public async getAll(): Promise<FeatureFlags> {
    return this.#repo.getAll();
  }
}
