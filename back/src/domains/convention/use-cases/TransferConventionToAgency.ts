import {
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  type TransferConventionToAgencyRequestDto,
  errors,
  transferConventionToAgencyRequestSchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
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

    const agency = await uow.agencyRepository.getById(inputParams.agencyId);

    if (!agency) {
      throw errors.agency.notFound({
        agencyId: inputParams.agencyId,
      });
    }

    await throwIfNotAllowedForUser({
      uow,
      jwtPayload,
      agencyId: convention.agencyId,
      convention,
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
          payload: { convention: updatedConvention, triggeredBy },
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
