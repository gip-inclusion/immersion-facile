import subDays from "date-fns/subDays";
import { z } from "zod";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UseCase } from "../../core/UseCase";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";

export class MarkEstablishmentsAsSearchableScript extends UseCase<
  void,
  number
> {
  inputSchema = z.void();

  constructor(
    private readonly establishmentAggregateRepository: EstablishmentAggregateRepository,
    private readonly timeGateway: TimeGateway,
  ) {
    super();
  }

  protected async _execute(): Promise<number> {
    const since = subDays(this.timeGateway.now(), 7);
    return this.establishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek(
      since,
    );
  }
}
