import {
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  type TransferConventionToAgencyRequestDto,
  agencyModifierRoles,
  errors,
  transferConventionToAgencyRequestSchema,
} from "shared";
import { throwErrorIfAgencyNotFound } from "../../../utils/agency";
import { conventionDtoToConventionReadDto } from "../../../utils/convention";
import { createTransactionalUseCase } from "../../core/UseCase";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { throwIfNotAuthorizedForRole } from "../../inclusion-connected-users/helpers/authorization.helper";
import { throwErrorOnConventionIdMismatch } from "../entities/Convention";

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

    const conventionReadDto = await conventionDtoToConventionReadDto(
      convention,
      uow,
    );
    await throwIfNotAuthorizedForRole({
      uow,
      convention: conventionReadDto,
      authorizedRoles: [...agencyModifierRoles, "back-office"],
      errorToThrow: errors.convention.transferNotAuthorizedForRole(),
      jwtPayload,
      isPeAdvisorAllowed: true,
      isValidatorOfAgencyRefersToAllowed: false,
    });

    // await throwErrorIfUserIsValidatorOfAgencyWithRefersTo({
    //   uow,
    //   agencyId: convention.agencyId,
    //   jwtPayload,
    // });

    const triggeredBy: TriggeredBy =
      "userId" in jwtPayload
        ? {
            kind: "connected-user",
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
