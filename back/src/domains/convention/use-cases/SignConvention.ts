import {
  type ConnectedUserDomainJwtPayload,
  type ConventionDomainJwtPayload,
  errors,
  type WithConventionId,
  type WithConventionIdLegacy,
  withConventionIdSchema,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import {
  domainTopicByTargetStatusMap,
  signConvention,
} from "../entities/Convention";

export class SignConvention extends TransactionalUseCase<
  WithConventionId,
  WithConventionIdLegacy,
  ConventionDomainJwtPayload | ConnectedUserDomainJwtPayload
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
    jwtPayload: ConventionDomainJwtPayload | ConnectedUserDomainJwtPayload,
  ): Promise<WithConventionIdLegacy> {
    const convention =
      await uow.conventionQueries.getConventionById(conventionId);
    if (!convention) throw errors.convention.notFound({ conventionId });

    const { role, userWithRights, signedConvention } = await signConvention({
      uow,
      convention,
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
            ? { kind: "connected-user", userId: userWithRights.id }
            : { kind: "convention-magic-link", role: role },
        },
      });
      await uow.outboxRepository.save(event);
    }

    return { id: signedConvention.id };
  }
}
