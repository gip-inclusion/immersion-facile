import {
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  type EditConventionCounsellorNameRequestDto,
  editConventionCounsellorNameRequestSchema,
  errors,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import {
  throwErrorIfUserIsValidatorOfAgencyWithRefersTo,
  throwErrorOnConventionIdMismatch,
  throwIfUserIsNotIFAdminNorAgencyModifier,
} from "../entities/Convention";

export type EditConventionCounsellorName = ReturnType<
  typeof makeEditConventionCounsellorName
>;

export const makeEditConventionCounsellorName = createTransactionalUseCase<
  EditConventionCounsellorNameRequestDto,
  void,
  ConventionRelatedJwtPayload,
  {
    createNewEvent: CreateNewEvent;
  }
>(
  {
    name: "EditCounsellorName",
    inputSchema: editConventionCounsellorNameRequestSchema,
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
      agencyReferent: {
        firstname: inputParams.firstname,
        lastname: inputParams.lastname,
      },
    };

    await Promise.all([
      uow.conventionRepository.update(updatedConvention),
      uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "ConventionCounsellorNameEdited",
          payload: {
            conventionId: updatedConvention.id,
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
    throw errors.convention.editCounsellorNameNotAllowedForStatus({
      status: status,
    });
  }
};
