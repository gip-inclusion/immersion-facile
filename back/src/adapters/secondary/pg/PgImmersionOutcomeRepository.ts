import { PoolClient } from "pg";
import { ImmersionOutcomeDto } from "shared/src/immersionOutcome/ImmersionOutcomeDto";
import { ImmersionOutcomeRepository } from "../../../domain/immersionOutcome/ports/ImmersionOutcomeRepository";

export class PgImmersionOutcomeRepository
  implements ImmersionOutcomeRepository
{
  constructor(private client: PoolClient) {}

  public async save(immersionOutcome: ImmersionOutcomeDto): Promise<void> {
    const { id, status, conventionId, establishmentFeedback } =
      immersionOutcome;

    await this.client
      .query(
        `INSERT INTO immersion_outcomes(
        id, status, convention_id, establishment_feedback
      ) VALUES($1, $2, $3, $4)`,
        [id, status, conventionId, establishmentFeedback],
      )
      .catch((error) => {
        if (error?.message.includes(noConventionMatchingErrorMessage))
          throw new Error(`No convention found for id ${conventionId}`);

        throw error;
      });
  }
}

const noConventionMatchingErrorMessage =
  '"immersion_outcomes" violates foreign key constraint "immersion_outcomes_convention_id_fkey"';
