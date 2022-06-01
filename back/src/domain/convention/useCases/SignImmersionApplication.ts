import { z } from "zod";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import {
  ConventionStatus,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import { ConventionMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainTopic } from "../../core/eventBus/events";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ConventionEntity } from "../entities/ConventionEntity";
import { ConventionRepository } from "../ports/ConventionRepository";
import { signConventionDtoWithRole } from "shared/src/convention/convention";

const logger = createLogger(__filename);

const domainTopicByTargetStatusMap: Partial<
  Record<ConventionStatus, DomainTopic>
> = {
  PARTIALLY_SIGNED: "ImmersionApplicationPartiallySigned",
  IN_REVIEW: "ImmersionApplicationFullySigned",
};

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

    const applicationEntity = await this.conventionRepository.getById(
      applicationId,
    );
    if (!applicationEntity) throw new NotFoundError(applicationId);
    const application = applicationEntity.toDto();
    const signedApplication = signConventionDtoWithRole(application, role);

    const signedEntity = ConventionEntity.create(signedApplication);

    const signedId = await this.conventionRepository.update(signedEntity);
    if (!signedId) throw new NotFoundError(signedId);

    const domainTopic = domainTopicByTargetStatusMap[signedApplication.status];
    if (domainTopic) {
      const event = this.createNewEvent({
        topic: domainTopic,
        payload: signedEntity.toDto(),
      });
      await this.outboxRepository.save(event);
    }

    return { id: signedId };
  }
}
