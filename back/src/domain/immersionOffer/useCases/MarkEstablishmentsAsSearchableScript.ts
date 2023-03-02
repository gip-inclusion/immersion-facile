import { z } from "zod";
import { UseCase } from "../../core/UseCase";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";
import subDays from "date-fns/subDays";
import { TimeGateway } from "../../core/ports/TimeGateway";

export class MarkEstablishmentsAsSearchableScript extends UseCase<void> {
  constructor(
    private readonly establishmentAggregateRepository: EstablishmentAggregateRepository,
    private readonly timeGateway: TimeGateway,
  ) {
    super();
  }

  inputSchema = z.void();

  public async _execute() {
    const since = subDays(this.timeGateway.now(), 7);
    await this.establishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek(
      since,
    );
  }
}
