import { ImmersionOutcomeEntity } from "../../domain/immersionOutcome/entities/ImmersionOutcomeEntity";
import { ImmersionOutcomeRepository } from "../../domain/immersionOutcome/ports/ImmersionOutcomeRepository";

export class InMemoryImmersionOutcomeRepository
  implements ImmersionOutcomeRepository
{
  private _immersionOutcomes: ImmersionOutcomeEntity[] = [];

  public async save(immersionOutcome: ImmersionOutcomeEntity): Promise<void> {
    this._immersionOutcomes.push(immersionOutcome);
  }

  // test purpose
  get immersionOutcomes(): ImmersionOutcomeEntity[] {
    return this._immersionOutcomes;
  }

  setImmersionOutcomes(immersionOutcomes: ImmersionOutcomeEntity[]) {
    this._immersionOutcomes = immersionOutcomes;
  }
}
