import subDays from "date-fns/subDays";
import { normalizedMonthInDays } from "shared";
import { z } from "zod";
import { UseCase } from "../../core/UseCase";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";

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
