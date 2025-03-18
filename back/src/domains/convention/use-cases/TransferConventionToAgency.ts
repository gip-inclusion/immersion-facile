import {
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  type TransferConventionToAgencyRequestDto,
  errors,
  transferConventionToAgencyRequestSchema,
} from "shared";
import { throwErrorIfAgencyNotFound } from "../../../utils/agency";
import type { AgencyRepository } from "../../agency/ports/AgencyRepository";
import { createTransactionalUseCase } from "../../core/UseCase";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { throwIfIcUserNotBackofficeAdmin } from "../../inclusion-connected-users/helpers/authorization.helper";
import { getUserWithRights } from "../../inclusion-connected-users/helpers/userRights.helper";
import {
  throwErrorOnConventionIdMismatch,
  throwIfNotAllowedForUser,
} from "../entities/Convention";

export type TransferConventionToAgency = ReturnType<
  typeof makeTransferConventionToAgency
>;

export const makeTransferConventionToAgency = createTransactionalUseCase<
  TransferConventionToAgencyRequestDto,
  void,
  ConventionRelatedJwtPayload,
  {
    createNewEvent: CreateNewEvent;
  }
>(
  {
    name: "TransferConventionToAgency",
    inputSchema: transferConventionToAgencyRequestSchema,
  },
  async ({ inputParams, uow, deps, currentUser: jwtPayload }) => {
    throwErrorOnConventionIdMismatch({
      requestedConventionId: inputParams.conventionId,
      jwtPayload,
    });

    const convention = await uow.conventionQueries.getConventionById(
      inputParams.conventionId,
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    throwErrorIfConventionStatusNotAllowed(convention.status, [
      "IN_REVIEW",
      "PARTIALLY_SIGNED",
      "READY_TO_SIGN",
    ]);

    await throwErrorIfAgencyNotFound({
      agencyId: inputParams.agencyId,
      agencyRepository: uow.agencyRepository,
    });

    await throwIfNotAllowedForUser({
      uow,
      jwtPayload,
      agencyId: convention.agencyId,
      convention,
    });

    await throwErrorIfUserIsValidatorOfAgencyWithRefersTo({
      uow,
      agencyId: convention.agencyId,
      jwtPayload,
    });

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

    const updatedConvention: ConventionDto = {
      ...convention,
      agencyId: inputParams.agencyId,
    };

    await Promise.all([
      uow.conventionRepository.update(updatedConvention),
      uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "ConventionTransferredToAgency",
          payload: {
            convention: updatedConvention,
            agencyId: inputParams.agencyId,
            justification: inputParams.justification,
            previousAgencyId: convention.agencyId,
            triggeredBy,
          },
        }),
      ),
    ]);
  },
);

const throwErrorIfConventionStatusNotAllowed = (
  status: ConventionStatus,
  allowedStatuses: ConventionStatus[],
) => {
  if (!allowedStatuses.includes(status)) {
    throw errors.convention.transferNotAllowedForStatus({
      status: status,
    });
  }
};

const throwErrorIfUserIsValidatorOfAgencyWithRefersTo = async ({
  uow,
  agencyId,
  jwtPayload,
}: {
  uow: UnitOfWork;
  agencyId: string;
  jwtPayload: ConventionRelatedJwtPayload;
}) => {
  const agency = await uow.agencyRepository.getById(agencyId);

  if (!agency) throw errors.agency.notFound({ agencyId });

  if (agency.refersToAgencyId) {
    if ("role" in jwtPayload) {
      if (jwtPayload.role === "back-office") return;
      if (jwtPayload.role !== "counsellor")
        throw errors.convention.unsupportedRole({ role: jwtPayload.role });
      return;
    }

    const userWithRights = await getUserWithRights(uow, jwtPayload.userId);

    if (userWithRights.isBackofficeAdmin) return;

    const agencyRightOnAgency = userWithRights.agencyRights.find(
      (agencyRight) => agencyRight.agency.id === agencyId,
    );

    if (!agencyRightOnAgency)
      throw errors.user.noRightsOnAgency({
        userId: userWithRights.id,
        agencyId: agencyId,
      });

    if (
      agencyRightOnAgency &&
      !agencyRightOnAgency.roles.includes("counsellor")
    )
      throw errors.convention.unsupportedRole({
        role: agencyRightOnAgency?.roles[0],
      });
  }
};
