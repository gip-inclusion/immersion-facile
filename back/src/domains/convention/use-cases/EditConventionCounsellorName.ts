import {
  agencyModifierRoles,
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  type EditConventionCounsellorNameRequestDto,
  editConventionCounsellorNameRequestSchema,
  errors,
} from "shared";
import { throwErrorIfConventionStatusNotAllowed } from "../../../utils/convention";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { createTransactionalUseCase } from "../../core/UseCase";
import { throwIfNotAuthorizedForRole } from "../../inclusion-connected-users/helpers/authorization.helper";
import { throwErrorOnConventionIdMismatch } from "../entities/Convention";

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

    const convention = await uow.conventionQueries.getConventionById(
      inputParams.conventionId,
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    throwErrorIfConventionStatusNotAllowed(
      convention.status,
      ["IN_REVIEW", "PARTIALLY_SIGNED", "READY_TO_SIGN"],
      errors.convention.editCounsellorNameNotAllowedForStatus({
        status: convention.status,
      }),
    );

    await throwIfNotAuthorizedForRole({
      uow,
      jwtPayload,
      convention,
      authorizedRoles: [...agencyModifierRoles, "back-office"],
      errorToThrow: errors.convention.editCounsellorNameNotAuthorizedForRole(),
      isPeAdvisorAllowed: true,
      isValidatorOfAgencyRefersToAllowed: false,
    });

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
