import { ImmersionOutcomeDto } from "shared/src/immersionOutcome/ImmersionOutcomeDto";
import { ImmersionOutcomeRepository } from "../../domain/immersionOutcome/ports/ImmersionOutcomeRepository";

export class InMemoryImmersionOutcomeRepository
  implements ImmersionOutcomeRepository
{
  private _immersionOutcomes: ImmersionOutcomeDto[] = [];

  public async save(immersionOutcome: ImmersionOutcomeDto): Promise<void> {
    this._immersionOutcomes.push(immersionOutcome);
  }

  // test purpose
  get immersionOutcomes(): ImmersionOutcomeDto[] {
    return this._immersionOutcomes;
  }

  setImmersionOutcomes(immersionOutcomes: ImmersionOutcomeDto[]) {
    this._immersionOutcomes = immersionOutcomes;
  }
}
