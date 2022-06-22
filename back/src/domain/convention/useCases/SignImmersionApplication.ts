import { z } from "zod";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import {
  ConventionStatus,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import {
  ConventionMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainTopic } from "../../core/eventBus/events";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ConventionRepository } from "../ports/ConventionRepository";
import { signConventionDtoWithRole } from "shared/src/convention/convention";

const logger = createLogger(__filename);

const domainTopicByTargetStatusMap: Partial<
  Record<ConventionStatus, DomainTopic>
> = {
  PARTIALLY_SIGNED: "ImmersionApplicationPartiallySigned",
  IN_REVIEW: "ImmersionApplicationFullySigned",
};

const roleAllowToSign: Role[] = ["establishment", "beneficiary"];

export class SignImmersionApplication extends UseCase<void, WithConventionId> {
  constructor(
    private readonly conventionRepository: ConventionRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {
    super();
  }

  inputSchema = z.void();

  public async _execute(
    _: void,
    { applicationId, role }: ConventionMagicLinkPayload,
  ): Promise<WithConventionId> {
    logger.debug({ applicationId, role });
    if (!roleAllowToSign.includes(role))
      throw new ForbiddenError(
        "Only Beneficiary or Mentor are allowed to sign convention",
      );

    const conventionDto = await this.conventionRepository.getById(
      applicationId,
    );
    if (!conventionDto) throw new NotFoundError(applicationId);
    const signedConvention = signConventionDtoWithRole(conventionDto, role);

    const signedId = await this.conventionRepository.update(signedConvention);
    if (!signedId) throw new NotFoundError(signedId);

    const domainTopic = domainTopicByTargetStatusMap[signedConvention.status];
    if (domainTopic) {
      const event = this.createNewEvent({
        topic: domainTopic,
        payload: signedConvention,
      });
      await this.outboxRepository.save(event);
    }

    return { id: signedId };
  }
}
