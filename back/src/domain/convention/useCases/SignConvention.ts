import {
  ConventionMagicLinkPayload,
  ConventionStatus,
  ExtractFromExisting,
  Role,
  signConventionDtoWithRole,
  WithConventionId,
} from "shared";
import { z } from "zod";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainTopic } from "../../core/eventBus/events";
import { Clock } from "../../core/ports/Clock";
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

const roleAllowToSign: Role[] = [
  "beneficiary",
  "establishment",
  "establishment-representative",
  "legal-representative",
  "beneficiary-representative",
  "beneficiary-current-employer",
];
const isAllowedToSign = (
  role: Role,
): role is ExtractFromExisting<
  Role,
  | "beneficiary"
  | "beneficiary-current-employer"
  | "establishment"
  | "establishment-representative"
  | "legal-representative"
  | "beneficiary-representative"
> => roleAllowToSign.includes(role);

export class SignConvention extends TransactionalUseCase<
  void,
  WithConventionId
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private clock: Clock,
  ) {
    super(uowPerformer);
  }

  inputSchema = z.void();

  public async _execute(
    _: void,
    uow: UnitOfWork,
    { applicationId, role }: ConventionMagicLinkPayload,
  ): Promise<WithConventionId> {
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
      this.clock.now().toISOString(),
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
      const event = this.createNewEvent({
        topic: domainTopic,
        payload: signedConvention,
      });
      await uow.outboxRepository.save(event);
    }

    return { id: signedId };
  }
}
