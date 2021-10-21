import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  ApplicationStatus,
  UpdateImmersionApplicationStatusRequestDto,
  UpdateImmersionApplicationStatusResponseDto,
} from "../../../shared/ImmersionApplicationDto";
import {
  MagicLinkPayload,
  Role,
} from "../../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainTopic } from "../../core/eventBus/events";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

const logger = createLogger(__filename);

type StatusTransitionConfig = {
  validInitialStatuses: ApplicationStatus[];
  validRoles: Role[];
  domainTopic: DomainTopic;
};

// key: status transition target, value: status transition config
const statusTransitionConfigs: Partial<
  Record<ApplicationStatus, StatusTransitionConfig>
> = {
  ACCEPTED_BY_COUNSELLOR: {
    validInitialStatuses: ["IN_REVIEW"],
    validRoles: ["counsellor"],
    domainTopic: "ImmersionApplicationAcceptedByCounsellor",
  },
  ACCEPTED_BY_VALIDATOR: {
    validInitialStatuses: ["IN_REVIEW", "ACCEPTED_BY_COUNSELLOR"],
    validRoles: ["validator"],
    domainTopic: "ImmersionApplicationAcceptedByValidator",
  },
  VALIDATED: {
    validInitialStatuses: ["ACCEPTED_BY_COUNSELLOR", "ACCEPTED_BY_VALIDATOR"],
    validRoles: ["admin"],
    domainTopic: "FinalImmersionApplicationValidationByAdmin",
  },

  // This config allows a counsellor to reject an application after it been
  // accepted by a validator. Should we be stricter? We assume that this is a
  // rare edge case that can be addressed at a later stage.
  REJECTED: {
    validInitialStatuses: [
      "IN_REVIEW",
      "ACCEPTED_BY_VALIDATOR",
      "ACCEPTED_BY_COUNSELLOR",
    ],
    validRoles: ["counsellor", "validator", "admin"],
    domainTopic: "ImmersionApplicationRejected",
  },

  // This enables the "require modifications" flow. The agents can put the request
  // back in the draft state for the beneficiary to modify the request and reapply.
  DRAFT: {
    validInitialStatuses: [
      "IN_REVIEW",
      "ACCEPTED_BY_VALIDATOR",
      "ACCEPTED_BY_COUNSELLOR",
    ],
    validRoles: ["counsellor", "validator", "admin"],
    domainTopic: "ImmersionApplicationRequiresModification",
  },
};

export class UpdateImmersionApplicationStatus
  implements
    UseCase<
      UpdateImmersionApplicationStatusRequestDto,
      UpdateImmersionApplicationStatusResponseDto
    >
{
  constructor(
    private readonly immersionApplicationRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  public async execute(
    { status, justification }: UpdateImmersionApplicationStatusRequestDto,
    { applicationId, roles }: MagicLinkPayload,
  ): Promise<UpdateImmersionApplicationStatusResponseDto> {
    logger.debug({ status, applicationId, roles });
    const statusTransitionConfig = statusTransitionConfigs[status];
    if (!statusTransitionConfig) throw new BadRequestError(status);

    if (!roles.some((role) => statusTransitionConfig.validRoles.includes(role)))
      throw new ForbiddenError();

    const immersionApplication =
      await this.immersionApplicationRepository.getById(applicationId);
    if (!immersionApplication) throw new NotFoundError(applicationId);
    if (
      !statusTransitionConfig.validInitialStatuses.includes(
        immersionApplication.status,
      )
    ) {
      throw new BadRequestError(status);
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

    const domainTopic = statusTransitionConfig.domainTopic;
    if (domainTopic) {
      let event = undefined;
      if (domainTopic === "ImmersionApplicationRequiresModification") {
        event = this.createNewEvent({
          topic: domainTopic,
          payload: {
            application: updatedEntity.toDto(),
            reason: justification ?? "",
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
