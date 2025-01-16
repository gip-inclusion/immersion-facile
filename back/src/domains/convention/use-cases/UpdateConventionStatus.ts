import {
  AgencyId,
  ConventionDto,
  ConventionReadDto,
  ConventionRelatedJwtPayload,
  ConventionStatus,
  DateString,
  InclusionConnectedUser,
  Role,
  Signatories,
  UpdateConventionStatusRequestDto,
  UserId,
  WithConventionIdLegacy,
  backOfficeEmail,
  errors,
  getRequesterRole,
  reviewedConventionStatuses,
  updateConventionStatusRequestSchema,
  validatedConventionStatuses,
} from "shared";
import { getAgencyEmailFromEmailHash } from "../../../utils/emailHash";
import { TransactionalUseCase } from "../../core/UseCase";
import { ConventionRequiresModificationPayload } from "../../core/events/eventPayload.dto";
import {
  DomainTopic,
  TriggeredBy,
  WithTriggeredBy,
} from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { getIcUserByUserId } from "../../inclusion-connected-users/helpers/inclusionConnectedUser.helper";
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
  DRAFT: "ConventionRequiresModification",
  DEPRECATED: "ConventionDeprecated",
};

type UpdateConventionStatusSupportedJwtPayload = ConventionRelatedJwtPayload;

const clearSignatories = (convention: ConventionReadDto): Signatories => {
  return {
    beneficiary: {
      ...convention.signatories.beneficiary,
      signedAt: undefined,
    },
    beneficiaryCurrentEmployer: convention.signatories
      .beneficiaryCurrentEmployer && {
      ...convention.signatories.beneficiaryCurrentEmployer,
      signedAt: undefined,
    },
    establishmentRepresentative: {
      ...convention.signatories.establishmentRepresentative,
      signedAt: undefined,
    },
    beneficiaryRepresentative: convention.signatories
      .beneficiaryRepresentative && {
      ...convention.signatories.beneficiaryRepresentative,
      signedAt: undefined,
    },
  };
};

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

    const { user, roleInPayload } = await this.#getRoleInPayloadOrUser(
      uow,
      payload,
    );

    const roles = roleInPayload
      ? [roleInPayload]
      : await this.#rolesFromUser(user, conventionRead);

    throwIfTransitionNotAllowed({
      roles,
      targetStatus: params.status,
      conventionRead,
    });

    const conventionUpdatedAt = this.timeGateway.now().toISOString();

    const statusJustification =
      params.status === "CANCELLED" ||
      params.status === "REJECTED" ||
      params.status === "DRAFT" ||
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
      ...(params.status === "DRAFT"
        ? { signatories: clearSignatories(conventionRead) }
        : {}),
    };

    const updatedId = await uow.conventionRepository.update(updatedConvention);
    if (!updatedId)
      throw errors.convention.notFound({
        conventionId: updatedConvention.id,
      });

    const domainTopic = domainTopicByTargetStatusMap[params.status];
    if (domainTopic) {
      const triggeredBy: TriggeredBy = user
        ? {
            kind: "inclusion-connected",
            userId: user.id,
          }
        : {
            kind: "convention-magic-link",
            role: roleInPayload,
          };

      const event =
        params.status === "DRAFT"
          ? this.#createRequireModificationEvent(
              params.modifierRole === "validator" ||
                params.modifierRole === "counsellor"
                ? {
                    requesterRole: getRequesterRole(roles),
                    convention: updatedConvention,
                    justification: params.statusJustification,
                    modifierRole: params.modifierRole,
                    agencyActorEmail: await this.#getAgencyActorEmail(
                      uow,
                      payload,
                      conventionRead,
                    ),
                    triggeredBy,
                  }
                : {
                    requesterRole: getRequesterRole(roles),
                    convention: updatedConvention,
                    justification: params.statusJustification,
                    modifierRole: params.modifierRole,
                    triggeredBy,
                  },
            )
          : this.#createEvent(updatedConvention, domainTopic, triggeredBy);

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
  ): Promise<
    | { user: InclusionConnectedUser; roleInPayload: undefined }
    | { user: undefined; roleInPayload: Role }
  > {
    if ("role" in payload)
      return { roleInPayload: payload.role, user: undefined };

    const user = await getIcUserByUserId(uow, payload.userId);
    if (!user)
      throw errors.user.notFound({
        userId: payload.userId,
      });

    return {
      user,
      roleInPayload: undefined,
    };
  }

  async #rolesFromUser(
    user: InclusionConnectedUser,
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
    const user = await getIcUserByUserId(uow, userId);
    if (!user) throw errors.user.notFound({ userId });
    const userAgencyRights = user.agencyRights.find(
      (agencyRight) => agencyRight.agency.id === agencyId,
    );
    if (!userAgencyRights)
      throw errors.user.noRightsOnAgency({ agencyId, userId });

    return user.email;
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

  #createRequireModificationEvent(
    payload: ConventionRequiresModificationPayload & WithTriggeredBy,
  ) {
    return this.createNewEvent({
      topic: "ConventionRequiresModification",
      payload,
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
