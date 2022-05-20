import { ImmersionOutcomeDto } from "shared/src/immersionOutcome/ImmersionOutcomeDto";

export interface ImmersionOutcomeRepository {
  save: (immersionOutcome: ImmersionOutcomeDto) => Promise<void>;
}
