import {
  type ConventionDomainPayload,
  type ConventionDto,
  type ConventionStatus,
  type InclusionConnectDomainJwtPayload,
  type Signatories,
  type UpdateConventionRequestDto,
  type WithConventionIdLegacy,
  errors,
  isModifierRole,
  isSignatoryRole,
  statusTransitionConfigs,
  updateConventionRequestSchema,
} from "shared";
import {
  agencyDtoToConventionAgencyFields,
  agencyWithRightToAgencyDto,
} from "../../../utils/agency";
import { TransactionalUseCase } from "../../core/UseCase";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { getUserWithRights } from "../../inclusion-connected-users/helpers/userRights.helper";
import {
  extractUserRolesOnConventionFromJwtPayload,
  signConvention,
} from "../entities/Convention";

export class UpdateConvention extends TransactionalUseCase<
  UpdateConventionRequestDto,
  WithConventionIdLegacy,
  ConventionDomainPayload | InclusionConnectDomainJwtPayload
> {
  protected inputSchema = updateConventionRequestSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    { convention }: UpdateConventionRequestDto,
    uow: UnitOfWork,
    jwtPayload: ConventionDomainPayload | InclusionConnectDomainJwtPayload,
  ): Promise<WithConventionIdLegacy> {
    await throwIfNotAllowedToUpdateConvention(uow, convention, jwtPayload);

    const minimalValidStatus: ConventionStatus = "READY_TO_SIGN";

    if (convention.status !== minimalValidStatus)
      throw errors.convention.updateBadStatusInParams({ id: convention.id });

    const conventionFromRepo = await uow.conventionRepository.getById(
      convention.id,
    );

    if (!conventionFromRepo)
      throw errors.convention.notFound({ conventionId: convention.id });

    const isTransitionAllowed = statusTransitionConfigs[
      minimalValidStatus
    ].validInitialStatuses.includes(conventionFromRepo.status);

    if (!isTransitionAllowed)
      throw errors.convention.updateBadStatusInRepo({
        id: conventionFromRepo.id,
        status: conventionFromRepo.status,
      });

    if (convention.updatedAt !== conventionFromRepo.updatedAt) {
      throw errors.convention.conventionGotUpdatedWhileUpdating();
    }
    const userRolesOnConvention =
      await extractUserRolesOnConventionFromJwtPayload(
        jwtPayload,
        uow,
        conventionFromRepo,
      );

    const hasSignatoryRole = userRolesOnConvention.some((role) =>
      isSignatoryRole(role),
    );
    const conventionWithSignatoriesSignedAtCleared = {
      ...convention,
      signatories: clearSignedAtForAllSignatories(convention),
    };

    const triggeredBy: TriggeredBy =
      "userId" in jwtPayload
        ? {
            kind: "inclusion-connected",
            userId: jwtPayload.userId,
          }
        : {
            kind: "convention-magic-link",
            role: jwtPayload.role,
          };

    if (hasSignatoryRole) {
      const agencyWithRights = await uow.agencyRepository.getById(
        convention.agencyId,
      );

      if (!agencyWithRights)
        throw errors.agency.notFound({ agencyId: convention.agencyId });

      const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);

      const { signedConvention } = await signConvention({
        uow,
        convention: {
          ...conventionWithSignatoriesSignedAtCleared,
          ...agencyDtoToConventionAgencyFields(agency),
        },
        jwtPayload,
        now: this.timeGateway.now().toISOString(),
      });

      await Promise.all([
        uow.conventionRepository.update(signedConvention),
        uow.outboxRepository.save(
          this.createNewEvent({
            topic: "ConventionModifiedAndSigned",
            payload: {
              convention: signedConvention,
              triggeredBy,
            },
          }),
        ),
      ]);
    } else {
      await Promise.all([
        uow.conventionRepository.update(
          conventionWithSignatoriesSignedAtCleared,
        ),
        uow.outboxRepository.save(
          this.createNewEvent({
            topic: "ConventionSubmittedAfterModification",
            payload: {
              convention: conventionWithSignatoriesSignedAtCleared,
              triggeredBy,
            },
          }),
        ),
      ]);
    }

    return { id: conventionFromRepo.id };
  }
}

const throwIfNotAllowedToUpdateConvention = async (
  uow: UnitOfWork,
  convention: ConventionDto,
  jwtPayload: ConventionDomainPayload | InclusionConnectDomainJwtPayload,
) => {
  if (!jwtPayload) throw errors.user.unauthorized();

  if ("userId" in jwtPayload) {
    const userWithRights = await getUserWithRights(uow, jwtPayload.userId);

    const isBackofficeAdmin = userWithRights.isBackofficeAdmin;

    const isEstablishmentRepresentative =
      userWithRights.email ===
      convention.signatories.establishmentRepresentative.email;

    const hasEnoughRightsOnAgency = userWithRights.agencyRights.some(
      (agencyRight) =>
        agencyRight.agency.id === convention.agencyId &&
        agencyRight.roles.some((role) =>
          ["validator", "counsellor"].includes(role),
        ),
    );

    if (
      isBackofficeAdmin ||
      isEstablishmentRepresentative ||
      hasEnoughRightsOnAgency
    ) {
      return;
    }

    if (!hasEnoughRightsOnAgency)
      throw errors.user.notEnoughRightOnAgency({
        userId: jwtPayload.userId,
        agencyId: convention.agencyId,
      });

    throw errors.convention.updateForbidden({ id: convention.id });
  }

  if ("applicationId" in jwtPayload) {
    if (jwtPayload.applicationId !== convention.id)
      throw errors.convention.forbiddenMissingRights({
        conventionId: convention.id,
      });

    const hasAllowedRole = isModifierRole(jwtPayload.role);

    if (!hasAllowedRole)
      throw errors.convention.updateForbidden({ id: convention.id });
  }
};

const clearSignedAtForAllSignatories = (
  convention: ConventionDto,
): Signatories => {
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
