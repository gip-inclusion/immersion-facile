import { z } from "zod";
import {
  allSignatoryRoles,
  ConventionJwtPayload,
  ConventionStatus,
  Role,
  SignatoryRole,
  signConventionDtoWithRole,
  WithConventionIdLegacy,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainTopic } from "../../core/eventBus/events";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { throwIfTransitionNotAllowed } from "../entities/Convention";

const logger = createLogger(__filename);

const domainTopicByTargetStatusMap: Partial<
  Record<ConventionStatus, DomainTopic>
> = {
  PARTIALLY_SIGNED: "ImmersionApplicationPartiallySigned",
  IN_REVIEW: "ImmersionApplicationFullySigned",
};

const isAllowedToSign = (role: Role): role is SignatoryRole =>
  allSignatoryRoles.includes(role as SignatoryRole);

export class SignConvention extends TransactionalUseCase<
  void,
  WithConventionIdLegacy
> {
  protected inputSchema = z.void();

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
    _: void,
    uow: UnitOfWork,
    { applicationId, role }: ConventionJwtPayload,
  ): Promise<WithConventionIdLegacy> {
    logger.debug({ applicationId, role });

    if (!isAllowedToSign(role))
      throw new ForbiddenError(
        "Only Beneficiary, his current employer, his legal representative or the establishment representative are allowed to sign convention",
      );

    const initialConvention = await uow.conventionRepository.getById(
      applicationId,
    );
    if (!initialConvention) throw new NotFoundError(applicationId);
    const signedConvention = signConventionDtoWithRole(
      initialConvention,
      role,
      this.#timeGateway.now().toISOString(),
    );
    throwIfTransitionNotAllowed({
      role,
      targetStatus: signedConvention.status,
      initialStatus: initialConvention.status,
    });

    const signedId = await uow.conventionRepository.update(signedConvention);
    if (!signedId) throw new NotFoundError(signedId);

    const domainTopic = domainTopicByTargetStatusMap[signedConvention.status];
    if (domainTopic) {
      const event = this.#createNewEvent({
        topic: domainTopic,
        payload: signedConvention,
      });
      await uow.outboxRepository.save(event);
    }

    return { id: signedId };
  }
}
