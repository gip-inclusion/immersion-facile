import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { ValidatedConventionNps } from "../entities/ValidatedConventionNps";
import { NpsRepository } from "../ports/NpsRepository";

export class PgNpsRepository implements NpsRepository {
  #transaction: KyselyDb;
  constructor(db: KyselyDb) {
    this.#transaction = db;
  }
  async save(nps: ValidatedConventionNps): Promise<void> {
    await this.#transaction
      .insertInto("nps")
      .values({
        score: nps.score,
        would_have_done_without_if: nps.wouldHaveDoneWithoutIF,
        comments: nps.comments,
        role: nps.role,
        convention_id: nps.conventionId,
        raw_result: JSON.stringify(nps.rawResult),
        response_id: nps.responseId,
        respondent_id: nps.respondentId,
      })
      .execute();
  }
}
