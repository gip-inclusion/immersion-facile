import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { FeatureFlags } from "../../../shared/featureFlags";
import {
  ApplicationStatus,
  SignImmersionApplicationRequestDto,
  signImmersionApplicationRequestSchema,
  SignImmersionApplicationResponseDto,
  signApplicationDtoWithRoles,
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
  IN_REVIEW: "ImmersionApplicationSubmittedByBeneficiary",
};

export class SignImmersionApplication extends UseCase<
  SignImmersionApplicationRequestDto,
  SignImmersionApplicationResponseDto
> {
  constructor(
    private readonly immersionApplicationRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {
    super();
  }

  inputSchema = signImmersionApplicationRequestSchema;

  public async _execute(
    params: any,
    { applicationId, roles }: MagicLinkPayload,
  ): Promise<SignImmersionApplicationResponseDto> {
    logger.debug({ applicationId, roles });

    const applicationEntity = await this.immersionApplicationRepository.getById(
      applicationId,
    );
    if (!applicationEntity) throw new NotFoundError(applicationId);
    const application = applicationEntity.toDto();
    const signedApplication = signApplicationDtoWithRoles(application, roles);

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
