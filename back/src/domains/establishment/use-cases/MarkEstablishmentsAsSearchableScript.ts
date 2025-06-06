import { z } from "zod/v4";
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
    return this.#establishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
      this.#timeGateway.now(),
    );
  }
}
