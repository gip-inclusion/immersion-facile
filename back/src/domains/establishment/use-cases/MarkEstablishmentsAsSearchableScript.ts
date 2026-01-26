import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";

export type MarkEstablishmentsAsSearchableScript = ReturnType<
  typeof makeMarkEstablishmentsAsSearchableScript
>;

export const makeMarkEstablishmentsAsSearchableScript = useCaseBuilder(
  "MarkEstablishmentsAsSearchableScript",
)
  .notTransactional()
  .withOutput<number>()
  .withDeps<{
    establishmentAggregateRepository: EstablishmentAggregateRepository;
    timeGateway: TimeGateway;
  }>()
  .build(async ({ deps }) =>
    deps.establishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
      deps.timeGateway.now(),
    ),
  );
