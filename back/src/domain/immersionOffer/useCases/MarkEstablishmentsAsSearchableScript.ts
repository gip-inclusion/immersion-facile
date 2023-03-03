import { z } from "zod";
import { UseCase } from "../../core/UseCase";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";
import subDays from "date-fns/subDays";
import { TimeGateway } from "../../core/ports/TimeGateway";

export class MarkEstablishmentsAsSearchableScript extends UseCase<
  void,
  number
> {
  constructor(
    private readonly establishmentAggregateRepository: EstablishmentAggregateRepository,
    private readonly timeGateway: TimeGateway,
  ) {
    super();
  }

  inputSchema = z.void();

  protected async _execute(): Promise<number> {
    const since = subDays(this.timeGateway.now(), 7);
    return this.establishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek(
      since,
    );
  }
}
