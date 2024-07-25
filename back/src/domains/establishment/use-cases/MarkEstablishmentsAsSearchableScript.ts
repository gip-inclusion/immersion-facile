import subDays from "date-fns/subDays";
import { z } from "zod";
import { UseCase } from "../../core/UseCase";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";

const normalizedMonthInDays = 28;

export class MarkEstablishmentsAsSearchableScript extends UseCase<
  void,
  number
> {
  protected inputSchema = z.void();

  readonly #establishmentAggregateRepository: EstablishmentAggregateRepository;

  readonly #timeGateway: TimeGateway;

  constructor(
    establishmentAggregateRepository: EstablishmentAggregateRepository,
    timeGateway: TimeGateway,
  ) {
    super();

    this.#establishmentAggregateRepository = establishmentAggregateRepository;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(): Promise<number> {
    const since = subDays(this.#timeGateway.now(), normalizedMonthInDays);
    return this.#establishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
      since,
    );
  }
}
