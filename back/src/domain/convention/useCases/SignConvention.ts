import { signConventionDtoWithRole } from "shared/src/convention/convention";
import {
  ConventionStatus,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import {
  ConventionMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";
import { z } from "zod";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainTopic } from "../../core/eventBus/events";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

const logger = createLogger(__filename);

const domainTopicByTargetStatusMap: Partial<
  Record<ConventionStatus, DomainTopic>
> = {
  PARTIALLY_SIGNED: "ImmersionApplicationPartiallySigned",
  IN_REVIEW: "ImmersionApplicationFullySigned",
};

const roleAllowToSign: Role[] = ["establishment", "beneficiary"];

export class SignConvention extends TransactionalUseCase<
  void,
  WithConventionId
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
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
    if (!roleAllowToSign.includes(role))
      throw new ForbiddenError(
        "Only Beneficiary or Mentor are allowed to sign convention",
      );

    const conventionDto = await uow.conventionRepository.getById(applicationId);
    if (!conventionDto) throw new NotFoundError(applicationId);
    const signedConvention = signConventionDtoWithRole(conventionDto, role);

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
