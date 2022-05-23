import { ImmersionOutcomeEntity } from "../entities/ImmersionOutcomeEntity";

export interface ImmersionOutcomeRepository {
  save: (immersionOutcome: ImmersionOutcomeEntity) => Promise<void>;
}
