import { z } from "zod";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import {
  ApplicationStatus,
  signApplicationDtoWithRole,
  WithImmersionApplicationId,
} from "../../../shared/ImmersionApplicationDto";
import { MagicLinkPayload } from "../../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainTopic } from "../../core/eventBus/events";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

const logger = createLogger(__filename);

const domainTopicByTargetStatusMap: Partial<
  Record<ApplicationStatus, DomainTopic>
> = {
  PARTIALLY_SIGNED: "ImmersionApplicationPartiallySigned",
  IN_REVIEW: "ImmersionApplicationFullySigned",
};

export class SignImmersionApplication extends UseCase<
  void,
  WithImmersionApplicationId
> {
  constructor(
    private readonly immersionApplicationRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {
    super();
  }

  inputSchema = z.void();

  public async _execute(
    _: void,
    { applicationId, role }: MagicLinkPayload,
  ): Promise<WithImmersionApplicationId> {
    logger.debug({ applicationId, role });

    const applicationEntity = await this.immersionApplicationRepository.getById(
      applicationId,
    );
    if (!applicationEntity) throw new NotFoundError(applicationId);
    const application = applicationEntity.toDto();
    const signedApplication = signApplicationDtoWithRole(application, role);

    const signedEntity = ImmersionApplicationEntity.create(signedApplication);

    const signedId =
      await this.immersionApplicationRepository.updateImmersionApplication(
        signedEntity,
      );
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
