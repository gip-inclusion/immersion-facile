import {
  type ConventionDomainPayload,
  type ConventionStatus,
  type InclusionConnectDomainJwtPayload,
  type WithConventionId,
  type WithConventionIdLegacy,
  withConventionIdSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { DomainTopic } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { signConvention } from "../entities/Convention";

const domainTopicByTargetStatusMap: Partial<
  Record<ConventionStatus, DomainTopic>
> = {
  PARTIALLY_SIGNED: "ConventionPartiallySigned",
  IN_REVIEW: "ConventionFullySigned",
};

export class SignConvention extends TransactionalUseCase<
  WithConventionId,
  WithConventionIdLegacy,
  ConventionDomainPayload | InclusionConnectDomainJwtPayload
> {
  protected inputSchema = withConventionIdSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#timeGateway = timeGateway;
  }

  public async _execute(
    { conventionId }: WithConventionId,
    uow: UnitOfWork,
    jwtPayload: ConventionDomainPayload | InclusionConnectDomainJwtPayload,
  ): Promise<WithConventionIdLegacy> {
    const { role, userWithRights, signedConvention } = await signConvention({
      uow,
      conventionId,
      jwtPayload,
      now: this.#timeGateway.now().toISOString(),
    });

    const domainTopic = domainTopicByTargetStatusMap[signedConvention.status];
    if (domainTopic) {
      const event = this.#createNewEvent({
        topic: domainTopic,
        payload: {
          convention: signedConvention,
          triggeredBy: userWithRights
            ? { kind: "inclusion-connected", userId: userWithRights.id }
            : { kind: "convention-magic-link", role: role },
        },
      });
      await uow.outboxRepository.save(event);
    }

    return { id: signedConvention.id };
  }
}
