import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import {
  ApplicationStatus,
  UpdateImmersionApplicationStatusRequestDto,
  WithImmersionApplicationId,
} from "../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { statusTransitionConfigs } from "../../../shared/immersionApplicationStatusTransitions";
import { MagicLinkPayload } from "../../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainTopic } from "../../core/eventBus/events";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";
import { updateImmersionApplicationStatusRequestSchema } from "../../../shared/ImmersionApplication/immersionApplication.schema";

const logger = createLogger(__filename);

const domainTopicByTargetStatusMap: Partial<
  Record<ApplicationStatus, DomainTopic>
> = {
  ACCEPTED_BY_COUNSELLOR: "ImmersionApplicationAcceptedByCounsellor",
  ACCEPTED_BY_VALIDATOR: "ImmersionApplicationAcceptedByValidator",
  VALIDATED: "FinalImmersionApplicationValidationByAdmin",
  REJECTED: "ImmersionApplicationRejected",
  DRAFT: "ImmersionApplicationRequiresModification",
};

export class UpdateImmersionApplicationStatus extends UseCase<
  UpdateImmersionApplicationStatusRequestDto,
  WithImmersionApplicationId
> {
  constructor(
    private readonly immersionApplicationRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {
    super();
  }

  inputSchema = updateImmersionApplicationStatusRequestSchema;

  public async _execute(
    { status, justification }: UpdateImmersionApplicationStatusRequestDto,
    { applicationId, role }: MagicLinkPayload,
  ): Promise<WithImmersionApplicationId> {
    logger.debug({ status, applicationId, role });
    const statusTransitionConfig = statusTransitionConfigs[status];

    if (!statusTransitionConfig.validRoles.includes(role))
      throw new ForbiddenError();

    const immersionApplication =
      await this.immersionApplicationRepository.getById(applicationId);
    if (!immersionApplication) throw new NotFoundError(applicationId);

    if (
      !statusTransitionConfig.validInitialStatuses.includes(
        immersionApplication.status,
      )
    ) {
      throw new BadRequestError(
        `Cannot go from status '${immersionApplication.status}' to '${status}'`,
      );
    }

    const updatedEntity = ImmersionApplicationEntity.create({
      ...immersionApplication.toDto(),
      status,
      rejectionJustification: status === "REJECTED" ? justification : undefined,

      // Invalidate signatures when the application is sent back to the beneficiary.
      beneficiaryAccepted:
        status === "DRAFT"
          ? false
          : immersionApplication.toDto().beneficiaryAccepted,
      enterpriseAccepted:
        status === "DRAFT"
          ? false
          : immersionApplication.toDto().enterpriseAccepted,
    });
    const updatedId =
      await this.immersionApplicationRepository.updateImmersionApplication(
        updatedEntity,
      );
    if (!updatedId) throw new NotFoundError(updatedId);

    const domainTopic = domainTopicByTargetStatusMap[status];
    if (domainTopic) {
      let event = undefined;
      if (domainTopic === "ImmersionApplicationRequiresModification") {
        event = this.createNewEvent({
          topic: domainTopic,
          payload: {
            application: updatedEntity.toDto(),
            reason: justification ?? "",
            roles: ["beneficiary", "establishment"],
          },
        });
      } else {
        event = this.createNewEvent({
          topic: domainTopic,
          payload: updatedEntity.toDto(),
        });
      }
      await this.outboxRepository.save(event);
    }

    return { id: updatedId };
  }
}
