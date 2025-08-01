import {
  type AgencyId,
  backOfficeEmail,
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  type DateString,
  errors,
  type Role,
  reviewedConventionStatuses,
  type UpdateConventionStatusRequestDto,
  type UserId,
  type UserWithRights,
  updateConventionStatusRequestSchema,
  validatedConventionStatuses,
  type WithConventionIdLegacy,
} from "shared";
import { getAgencyEmailFromEmailHash } from "../../../utils/emailHash";
import { getUserWithRights } from "../../connected-users/helpers/userRights.helper";
import type { DomainTopic, TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfTransitionNotAllowed } from "../entities/Convention";

const domainTopicByTargetStatusMap: Record<
  ConventionStatus,
  DomainTopic | null
> = {
  READY_TO_SIGN: null,
  PARTIALLY_SIGNED: "ConventionPartiallySigned",
  IN_REVIEW: "ConventionFullySigned",
  ACCEPTED_BY_COUNSELLOR: "ConventionAcceptedByCounsellor",
  ACCEPTED_BY_VALIDATOR: "ConventionAcceptedByValidator",
  REJECTED: "ConventionRejected",
  CANCELLED: "ConventionCancelled",
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
    const conventionRead = await uow.conventionQueries.getConventionById(
      params.conventionId,
    );
    if (!conventionRead)
      throw errors.convention.notFound({
        conventionId: params.conventionId,
      });

    const agency = await uow.agencyRepository.getById(conventionRead.agencyId);

    if (!agency)
      throw errors.agency.notFound({
        agencyId: conventionRead.agencyId,
      });

    const roleOrUser = await this.#getRoleInPayloadOrUser(uow, payload);

    const roles =
      "roleInPayload" in roleOrUser
        ? [roleOrUser.roleInPayload]
        : await this.#rolesFromUser(roleOrUser.userWithRights, conventionRead);

    const assessment = await uow.assessmentRepository.getByConventionId(
      conventionRead.id,
    );

    throwIfTransitionNotAllowed({
      roles,
      targetStatus: params.status,
      conventionRead,
      hasAssessment: !!assessment,
    });

    const conventionUpdatedAt = this.timeGateway.now().toISOString();

    const statusJustification =
      params.status === "CANCELLED" ||
      params.status === "REJECTED" ||
      params.status === "DEPRECATED"
        ? params.statusJustification
        : undefined;

    const hasCounsellor =
      params.status === "ACCEPTED_BY_COUNSELLOR" &&
      (params.lastname || params.firstname);

    const hasValidator =
      params.status === "ACCEPTED_BY_VALIDATOR" &&
      (params.lastname || params.firstname);

    const getDateApproval = (): DateString | undefined => {
      if (reviewedConventionStatuses.includes(params.status))
        return conventionUpdatedAt;
      if (validatedConventionStatuses.includes(params.status))
        return conventionRead.dateApproval;
      return undefined;
    };

    const updatedConvention: ConventionDto = {
      ...conventionRead,
      status: params.status,
      dateValidation: validatedConventionStatuses.includes(params.status)
        ? conventionUpdatedAt
        : undefined,
      dateApproval: getDateApproval(),
      statusJustification,
      ...(hasCounsellor
        ? {
            validators: {
              ...conventionRead.validators,
              agencyCounsellor: {
                firstname: params.firstname,
                lastname: params.lastname,
              },
            },
          }
        : {}),
      ...(hasValidator
        ? {
            validators: {
              ...conventionRead.validators,
              agencyValidator: {
                firstname: params.firstname,
                lastname: params.lastname,
              },
            },
          }
        : {}),
    };

    const updatedId = await uow.conventionRepository.update(updatedConvention);
    if (!updatedId)
      throw errors.convention.notFound({
        conventionId: updatedConvention.id,
      });

    const domainTopic = domainTopicByTargetStatusMap[params.status];
    if (domainTopic) {
      const triggeredBy: TriggeredBy =
        "roleInPayload" in roleOrUser
          ? {
              kind: "convention-magic-link",
              role: roleOrUser.roleInPayload,
            }
          : {
              kind: "connected-user",
              userId: roleOrUser.userWithRights.id,
            };

      const event = this.#createEvent(
        updatedConvention,
        domainTopic,
        triggeredBy,
      );

      await uow.outboxRepository.save({
        ...event,
        occurredAt: conventionUpdatedAt,
      });
    }

    return { id: updatedId };
  }

  async #getRoleInPayloadOrUser(
    uow: UnitOfWork,
    payload: UpdateConventionStatusSupportedJwtPayload,
  ): Promise<{ userWithRights: UserWithRights } | { roleInPayload: Role }> {
    if ("role" in payload) return { roleInPayload: payload.role };

    const userWithRights = await getUserWithRights(uow, payload.userId);
    if (!userWithRights)
      throw errors.user.notFound({
        userId: payload.userId,
      });

    return {
      userWithRights: userWithRights,
    };
  }

  async #rolesFromUser(
    user: UserWithRights,
    convention: ConventionDto,
  ): Promise<Role[]> {
    const roles: Role[] = [];
    if (user.isBackofficeAdmin) roles.push("back-office");

    if (user.email === convention.signatories.establishmentRepresentative.email)
      roles.push("establishment-representative");

    const userAgencyRight = user.agencyRights.find(
      (agencyRight) => agencyRight.agency.id === convention.agencyId,
    );

    if (!userAgencyRight && roles.length === 0) {
      throw errors.user.noRightsOnAgency({
        agencyId: convention.agencyId,
        userId: user.id,
      });
    }

    if (userAgencyRight) roles.push(...userAgencyRight.roles);

    return roles;
  }

  async #agencyEmailFromUserIdAndAgencyId(
    uow: UnitOfWork,
    userId: UserId,
    agencyId: AgencyId,
  ): Promise<string> {
    const userWithRights = await getUserWithRights(uow, userId);
    if (!userWithRights) throw errors.user.notFound({ userId });
    const userAgencyRights = userWithRights.agencyRights.find(
      (agencyRight) => agencyRight.agency.id === agencyId,
    );
    if (!userAgencyRights)
      throw errors.user.noRightsOnAgency({ agencyId, userId });

    return userWithRights.email;
  }

  #createEvent(
    updatedConventionDto: ConventionDto,
    domainTopic: DomainTopic,
    triggeredBy: TriggeredBy,
  ) {
    return this.createNewEvent({
      topic: domainTopic,
      payload: {
        convention: updatedConventionDto,
        triggeredBy,
      },
    });
  }

  #getAgencyActorEmail = async (
    uow: UnitOfWork,
    payload: UpdateConventionStatusSupportedJwtPayload,
    originalConvention: ConventionDto,
  ): Promise<string> => {
    if (!("role" in payload)) {
      const agencyIcUserEmail = await this.#agencyEmailFromUserIdAndAgencyId(
        uow,
        payload.userId,
        originalConvention.agencyId,
      );
      return agencyIcUserEmail;
    }

    return "emailHash" in payload
      ? getAgencyEmailFromEmailHash(
          uow,
          originalConvention.agencyId,
          payload.emailHash,
        )
      : backOfficeEmail;
  };
}
