import {
  AgencyId,
  AgencyRole,
  AuthenticatedUserId,
  backOfficeEmail,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionRelatedJwtPayload,
  ConventionStatus,
  Email,
  stringToMd5,
  UpdateConventionStatusRequestDto,
  updateConventionStatusRequestSchema,
  validatedConventionStatuses,
  WithConventionIdLegacy,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { ConventionRequiresModificationPayload } from "../../core/eventBus/eventPayload.dto";
import { DomainTopic } from "../../core/eventBus/events";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import {
  conventionMissingMessage,
  throwIfTransitionNotAllowed,
} from "../entities/Convention";

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

type UpdateConventionStatusSupportedJwtPayload = ConventionRelatedJwtPayload;

export class UpdateConventionStatus extends TransactionalUseCase<
  UpdateConventionStatusRequestDto,
  WithConventionIdLegacy,
  UpdateConventionStatusSupportedJwtPayload
> {
  protected inputSchema = updateConventionStatusRequestSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    params: UpdateConventionStatusRequestDto,
    uow: UnitOfWork,
    payload: UpdateConventionStatusSupportedJwtPayload,
  ): Promise<WithConventionIdLegacy> {
    const originalConvention = await uow.conventionRepository.getById(
      params.conventionId,
    );
    if (!originalConvention)
      throw new NotFoundError(conventionMissingMessage(params.conventionId));

    const role =
      "role" in payload
        ? payload.role
        : await this.#agencyRoleFromUserIdAndAgencyId(
            uow,
            payload.userId,
            originalConvention.agencyId,
          );
    if (role === "toReview" || role === "agencyOwner")
      throw new ForbiddenError(
        `${role} is not allowed to go to status ${params.status}`,
      );

    throwIfTransitionNotAllowed({
      initialStatus: originalConvention.status,
      role,
      targetStatus: params.status,
    });

    const conventionUpdatedAt = this.timeGateway.now().toISOString();

    const statusJustification =
      params.status === "CANCELLED" ||
      params.status === "REJECTED" ||
      params.status === "DRAFT" ||
      params.status === "DEPRECATED"
        ? params.statusJustification
        : undefined;

    const conventionBuilder = new ConventionDtoBuilder(originalConvention)
      .withStatus(params.status)
      .withDateValidation(
        validatedConventionStatuses.includes(params.status)
          ? conventionUpdatedAt
          : undefined,
      )
      .withStatusJustification(statusJustification);

    if (params.status === "DRAFT") conventionBuilder.notSigned();

    const updatedConvention: ConventionDto = conventionBuilder.build();

    const updatedId = await uow.conventionRepository.update(updatedConvention);
    if (!updatedId) throw new NotFoundError(updatedId);

    const domainTopic = domainTopicByTargetStatusMap[params.status];
    if (domainTopic)
      await uow.outboxRepository.save({
        ...(params.status === "DRAFT"
          ? this.#createRequireModificationEvent(
              params.modifierRole === "validator" ||
                params.modifierRole === "counsellor"
                ? {
                    requesterRole: role,
                    convention: updatedConvention,
                    justification: params.statusJustification,
                    modifierRole: params.modifierRole,
                    agencyActorEmail: await this.#getAgencyActorEmail(
                      uow,
                      payload,
                      originalConvention,
                    ),
                  }
                : {
                    requesterRole: role,
                    convention: updatedConvention,
                    justification: params.statusJustification,
                    modifierRole: params.modifierRole,
                  },
            )
          : this.#createEvent(updatedConvention, domainTopic)),
        occurredAt: conventionUpdatedAt,
      });

    return { id: updatedId };
  }

  async #agencyRoleFromUserIdAndAgencyId(
    uow: UnitOfWork,
    userId: AuthenticatedUserId,
    agencyId: AgencyId,
  ): Promise<AgencyRole> {
    const user = await uow.inclusionConnectedUserRepository.getById(userId);
    if (!user)
      throw new NotFoundError(
        `User '${userId}' not found on inclusion connected user repository.`,
      );
    const userAgencyRights = user.agencyRights.find(
      (agencyRight) => agencyRight.agency.id === agencyId,
    );
    if (!userAgencyRights)
      throw new ForbiddenError(
        `User '${userId}' has no rôle on agency '${agencyId}'.`,
      );
    return userAgencyRights.role;
  }

  async #agencyEmailFromUserIdAndAgencyId(
    uow: UnitOfWork,
    userId: AuthenticatedUserId,
    agencyId: AgencyId,
  ): Promise<string> {
    const user = await uow.inclusionConnectedUserRepository.getById(userId);
    if (!user)
      throw new NotFoundError(
        `User '${userId}' not found on inclusion connected user repository.`,
      );
    const userAgencyRights = user.agencyRights.find(
      (agencyRight) => agencyRight.agency.id === agencyId,
    );
    if (!userAgencyRights)
      throw new ForbiddenError(
        `User '${userId}' has no rôle on agency '${agencyId}'.`,
      );
    return user.email;
  }

  #createEvent(updatedDto: ConventionDto, domainTopic: DomainTopic) {
    return this.createNewEvent({
      topic: domainTopic,
      payload: updatedDto,
    });
  }

  #createRequireModificationEvent(
    payload: ConventionRequiresModificationPayload,
  ) {
    return this.createNewEvent({
      topic: "ImmersionApplicationRequiresModification",
      payload,
    });
  }

  #getAgencyActorEmail = async (
    uow: UnitOfWork,
    payload: UpdateConventionStatusSupportedJwtPayload,
    originalConvention: ConventionDto,
  ): Promise<string> => {
    const getEmailFromEmailHash = async (
      agencyId: AgencyId,
      emailHash: string,
    ): Promise<Email> => {
      const agencies = await uow.agencyRepository.getByIds([agencyId]);
      const agency = agencies.at(0);
      if (!agency)
        throw new NotFoundError(`No agency found with id ${agencyId}`);

      const agencyEmails = [
        ...agency.validatorEmails,
        ...agency.counsellorEmails,
      ];

      const email = agencyEmails.find(
        (agencyEmail) => stringToMd5(agencyEmail) === emailHash,
      );

      if (!email)
        throw new NotFoundError(
          `Mail not found for agency with id: ${agencyId} on agency repository.`,
        );

      return email;
    };

    const email =
      // eslint-disable-next-line no-nested-ternary
      "emailHash" in payload
        ? getEmailFromEmailHash(originalConvention.agencyId, payload.emailHash)
        : "userId" in payload
        ? await this.#agencyEmailFromUserIdAndAgencyId(
            uow,
            payload.userId,
            originalConvention.agencyId,
          )
        : backOfficeEmail;

    return email;
  };
}
