import {
  ConventionDto,
  ConventionDtoBuilder,
  ConventionId,
  ConventionStatus,
  Role,
  UpdateConventionStatusRequestDto,
  updateConventionStatusRequestSchema,
  validatedConventionStatuses,
  WithConventionId,
} from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainTopic } from "../../core/eventBus/events";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { makeGetStoredConventionOrThrowIfNotAllowed } from "../entities/Convention";

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
  DEPRECATED: "ConventionDeprecated",
};

type UpdateConventionStatusPayload = {
  conventionId: ConventionId;
  role: Role;
};

export class UpdateConventionStatus extends TransactionalUseCase<
  UpdateConventionStatusRequestDto,
  WithConventionId,
  UpdateConventionStatusPayload
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = updateConventionStatusRequestSchema;

  public async _execute(
    params: UpdateConventionStatusRequestDto,
    uow: UnitOfWork,
    { conventionId, role }: UpdateConventionStatusPayload,
  ): Promise<WithConventionId> {
    logger.debug({ status: params.status, conventionId, role });

    const conventionUpdatedAt = this.timeGateway.now().toISOString();

    const statusJustification =
      params.status === "CANCELLED" ||
      params.status === "REJECTED" ||
      params.status === "DRAFT" ||
      params.status === "DEPRECATED"
        ? params.statusJustification
        : undefined;

    const conventionBuilder = new ConventionDtoBuilder(
      await makeGetStoredConventionOrThrowIfNotAllowed(
        uow.conventionRepository,
      )(params.status, role, conventionId),
    )
      .withStatus(params.status)
      .withDateValidation(
        validatedConventionStatuses.includes(params.status)
          ? conventionUpdatedAt
          : undefined,
      )
      .withStatusJustification(statusJustification);

    if (params.status === "DRAFT") conventionBuilder.notSigned();

    const updatedDto: ConventionDto = conventionBuilder.build();

    const updatedId = await uow.conventionRepository.update(updatedDto);
    if (!updatedId) throw new NotFoundError(updatedId);

    const domainTopic = domainTopicByTargetStatusMap[params.status];
    if (domainTopic)
      await uow.outboxRepository.save({
        ...this.createEvent(updatedDto, domainTopic, role, statusJustification),
        occurredAt: conventionUpdatedAt,
      });

    return { id: updatedId };
  }

  private createEvent(
    updatedDto: ConventionDto,
    domainTopic: DomainTopic,
    requesterRole: Role,
    justification?: string,
  ) {
    if (domainTopic === "ImmersionApplicationRequiresModification")
      return this.createNewEvent({
        topic: domainTopic,
        payload: {
          convention: updatedDto,
          justification: justification ?? "",
          roles: [requesterRole],
        },
      });

    return this.createNewEvent({
      topic: domainTopic,
      payload: updatedDto,
    });
  }
}
