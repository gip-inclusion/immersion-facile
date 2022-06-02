import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import {
  ApplicationStatus,
  ImmersionApplicationId,
  UpdateImmersionApplicationStatusRequestDto,
  WithImmersionApplicationId,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { statusTransitionConfigs } from "shared/src/immersionApplicationStatusTransitions";
import {
  ConventionMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainTopic } from "../../core/eventBus/events";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";
import { updateImmersionApplicationStatusRequestSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";

const logger = createLogger(__filename);

const domainTopicByTargetStatusMap: Record<
  ApplicationStatus,
  DomainTopic | null
> = {
  READY_TO_SIGN: null,
  PARTIALLY_SIGNED: "ImmersionApplicationPartiallySigned",
  IN_REVIEW: "ImmersionApplicationFullySigned",
  ACCEPTED_BY_COUNSELLOR: "ImmersionApplicationAcceptedByCounsellor",
  ACCEPTED_BY_VALIDATOR: "ImmersionApplicationAcceptedByValidator",
  VALIDATED: "FinalImmersionApplicationValidationByAdmin",
  REJECTED: "ImmersionApplicationRejected",
  CANCELLED: "ImmersionApplicationCancelled",
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
    { applicationId, role }: ConventionMagicLinkPayload,
  ): Promise<WithImmersionApplicationId> {
    logger.debug({ status, applicationId, role });
    const immersionApplication =
      await this.getImmersionStatusOrThrowIfNotAllowed(
        status,
        role,
        applicationId,
      );

    const updatedEntity = ImmersionApplicationEntity.create({
      ...immersionApplication.toDto(),
      ...(status === "REJECTED" && { rejectionJustification: justification }),
      ...(status === "DRAFT" && {
        enterpriseAccepted: false,
        beneficiaryAccepted: false,
      }),
      status,
    });

    const updatedId =
      await this.immersionApplicationRepository.updateImmersionApplication(
        updatedEntity,
      );
    if (!updatedId) throw new NotFoundError(updatedId);

    const domainTopic = domainTopicByTargetStatusMap[status];
    if (!domainTopic) return { id: updatedId };

    const event = this.createEvent(updatedEntity, domainTopic, justification);
    await this.outboxRepository.save(event);
    return { id: updatedId };
  }

  private createEvent(
    updatedEntity: ImmersionApplicationEntity,
    domainTopic: DomainTopic,
    justification?: string,
  ) {
    if (domainTopic === "ImmersionApplicationRequiresModification")
      return this.createNewEvent({
        topic: domainTopic,
        payload: {
          application: updatedEntity.toDto(),
          reason: justification ?? "",
          roles: ["beneficiary", "establishment"],
        },
      });

    return this.createNewEvent({
      topic: domainTopic,
      payload: updatedEntity.toDto(),
    });
  }

  private async getImmersionStatusOrThrowIfNotAllowed(
    status: ApplicationStatus,
    role: Role,
    applicationId: ImmersionApplicationId,
  ): Promise<ImmersionApplicationEntity> {
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
    )
      throw new BadRequestError(
        `Cannot go from status '${immersionApplication.status}' to '${status}'`,
      );

    return immersionApplication;
  }
}
