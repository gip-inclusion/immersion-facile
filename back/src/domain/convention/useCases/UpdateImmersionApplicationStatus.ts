import {
  ConventionDto,
  ConventionId,
  ConventionStatus,
  UpdateConventionStatusRequestDto,
  validatedConventionStatuses,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import { updateConventionStatusRequestSchema } from "shared/src/convention/convention.schema";
import { statusTransitionConfigs } from "shared/src/convention/conventionStatusTransitions";
import {
  ConventionMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../../core/eventBus/events";
import { Clock } from "../../core/ports/Clock";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

const logger = createLogger(__filename);

const domainTopicByTargetStatusMap: Record<
  ConventionStatus,
  DomainTopic | null
> = {
  READY_TO_SIGN: null,
  PARTIALLY_SIGNED: "ImmersionApplicationPartiallySigned",
  IN_REVIEW: "ImmersionApplicationFullySigned",
  ACCEPTED_BY_COUNSELLOR: "ImmersionApplicationAcceptedByCounsellor",
  ACCEPTED_BY_VALIDATOR: "ImmersionApplicationAcceptedByValidator",
  REJECTED: "ImmersionApplicationRejected",
  CANCELLED: "ImmersionApplicationCancelled",
  DRAFT: "ImmersionApplicationRequiresModification",
};

export class UpdateImmersionApplicationStatus extends TransactionalUseCase<
  UpdateConventionStatusRequestDto,
  WithConventionId
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly clock: Clock,
  ) {
    super(uowPerformer);
  }

  inputSchema = updateConventionStatusRequestSchema;

  public async _execute(
    { status, justification }: UpdateConventionStatusRequestDto,
    uow: UnitOfWork,
    { applicationId, role }: ConventionMagicLinkPayload,
  ): Promise<WithConventionId> {
    logger.debug({ status, applicationId, role });
    const storedDto = await this.getStoredConventionOrThrowIfNotAllowed(
      uow,
      status,
      role,
      applicationId,
    );

    const conventionUpdatedAt = this.clock.now().toISOString();
    const updatedDto: ConventionDto = {
      ...storedDto,
      ...(status === "REJECTED" && { rejectionJustification: justification }),
      ...(status === "DRAFT" && {
        enterpriseAccepted: false,
        beneficiaryAccepted: false,
      }),
      status,
      dateValidation: validatedConventionStatuses.includes(status)
        ? conventionUpdatedAt
        : undefined,
    };

    const updatedId = await uow.conventionRepository.update(updatedDto);
    if (!updatedId) throw new NotFoundError(updatedId);

    const domainTopic = domainTopicByTargetStatusMap[status];
    if (!domainTopic) return { id: updatedId };

    const event: DomainEvent = {
      ...this.createEvent(updatedDto, domainTopic, justification),
      occurredAt: conventionUpdatedAt,
    };
    await uow.outboxRepository.save(event);
    return { id: updatedId };
  }

  private createEvent(
    updatedDto: ConventionDto,
    domainTopic: DomainTopic,
    justification?: string,
  ) {
    if (domainTopic === "ImmersionApplicationRequiresModification")
      return this.createNewEvent({
        topic: domainTopic,
        payload: {
          convention: updatedDto,
          reason: justification ?? "",
          roles: ["beneficiary", "establishment"],
        },
      });

    return this.createNewEvent({
      topic: domainTopic,
      payload: updatedDto,
    });
  }

  private async getStoredConventionOrThrowIfNotAllowed(
    uow: UnitOfWork,
    status: ConventionStatus,
    role: Role,
    applicationId: ConventionId,
  ): Promise<ConventionDto> {
    const statusTransitionConfig = statusTransitionConfigs[status];

    if (!statusTransitionConfig.validRoles.includes(role))
      throw new ForbiddenError();

    const convention = await uow.conventionRepository.getById(applicationId);
    if (!convention) throw new NotFoundError(applicationId);

    if (
      !statusTransitionConfig.validInitialStatuses.includes(convention.status)
    )
      throw new BadRequestError(
        `Cannot go from status '${convention.status}' to '${status}'`,
      );

    return convention;
  }
}
