import { mapObjIndexed } from "ramda";
import {
  ConventionDto,
  ConventionStatus,
  UpdateConventionStatusRequestDto,
  validatedConventionStatuses,
  WithConventionId,
} from "shared";
import { updateConventionStatusRequestSchema } from "shared";
import { ConventionMagicLinkPayload } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../../core/eventBus/events";
import { Clock } from "../../core/ports/Clock";
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
};

export class UpdateConventionStatus extends TransactionalUseCase<
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

    const getStoredConventionOrThrowIfNotAllowed =
      makeGetStoredConventionOrThrowIfNotAllowed(uow.conventionRepository);

    const storedDto = await getStoredConventionOrThrowIfNotAllowed(
      status,
      role,
      applicationId,
    );

    const conventionUpdatedAt = this.clock.now().toISOString();
    const { beneficiary, mentor, ...otherSignatories } = storedDto.signatories;
    const updatedDto: ConventionDto = {
      ...storedDto,
      ...(status === "REJECTED" && { rejectionJustification: justification }),
      ...(status === "DRAFT" && {
        signatories: {
          ...mapObjIndexed(
            (signatory) => ({ ...signatory, signedAt: undefined }),
            otherSignatories,
          ),
          beneficiary: {
            ...beneficiary,
            signedAt: undefined,
          },
          mentor: {
            ...mentor,
            signedAt: undefined,
          },
        },
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
}
