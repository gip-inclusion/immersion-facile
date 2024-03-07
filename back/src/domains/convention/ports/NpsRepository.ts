import { ValidatedConventionNps } from "../entities/ValidatedConventionNps";

export interface NpsRepository {
  save(nps: ValidatedConventionNps): Promise<void>;
}
