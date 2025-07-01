import {
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  errors,
  type TransferConventionToAgencyRequestDto,
  transferConventionToAgencyRequestSchema,
} from "shared";
import { throwErrorIfAgencyNotFound } from "../../../utils/agency";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { createTransactionalUseCase } from "../../core/UseCase";
import {
  throwErrorIfUserIsValidatorOfAgencyWithRefersTo,
  throwErrorOnConventionIdMismatch,
  throwIfUserIsNotIFAdminNorAgencyModifier,
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

    const convention = await uow.conventionRepository.getById(
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

    await throwIfUserIsNotIFAdminNorAgencyModifier({
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
            conventionId: updatedConvention.id,
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
