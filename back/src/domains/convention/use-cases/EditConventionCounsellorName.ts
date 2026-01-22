import {
  agencyModifierRoles,
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  type EditConventionCounsellorNameRequestDto,
  editConventionCounsellorNameRequestSchema,
  errors,
} from "shared";
import {
  conventionDtoToConventionReadDto,
  throwErrorIfConventionStatusNotAllowed,
} from "../../../utils/convention";
import { throwIfNotAuthorizedForRole } from "../../connected-users/helpers/authorization.helper";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { throwErrorOnConventionIdMismatch } from "../entities/Convention";

export type EditConventionCounsellorName = ReturnType<
  typeof makeEditConventionCounsellorName
>;

export const makeEditConventionCounsellorName = useCaseBuilder(
  "EditCounsellorName",
)
  .withInput<EditConventionCounsellorNameRequestDto>(
    editConventionCounsellorNameRequestSchema,
  )
  .withOutput<void>()
  .withCurrentUser<ConventionRelatedJwtPayload>()
  .withDeps<{
    createNewEvent: CreateNewEvent;
    timeGateway: TimeGateway;
  }>()
  .build(async ({ inputParams, uow, deps, currentUser: jwtPayload }) => {
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

    throwErrorIfConventionStatusNotAllowed(
      convention.status,
      ["IN_REVIEW", "PARTIALLY_SIGNED", "READY_TO_SIGN"],
      errors.convention.editCounsellorNameNotAllowedForStatus({
        status: convention.status,
      }),
    );

    const conventionRead = await conventionDtoToConventionReadDto(
      convention,
      uow,
    );

    await throwIfNotAuthorizedForRole({
      uow,
      jwtPayload,
      convention: conventionRead,
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
      uow.conventionRepository.update({
        conventionDto: updatedConvention,
        phoneIds: {
          beneficiary: await uow.phoneNumberRepository.getIdByPhoneNumber(
            updatedConvention.signatories.beneficiary.phone,
            deps.timeGateway.now(),
          ),
          establishmentRepresentative:
            await uow.phoneNumberRepository.getIdByPhoneNumber(
              updatedConvention.signatories.establishmentRepresentative.phone,
              deps.timeGateway.now(),
            ),
          establishmentTutor:
            await uow.phoneNumberRepository.getIdByPhoneNumber(
              updatedConvention.establishmentTutor.phone,
              deps.timeGateway.now(),
            ),
          beneficiaryRepresentative: updatedConvention.signatories
            .beneficiaryRepresentative
            ? await uow.phoneNumberRepository.getIdByPhoneNumber(
                updatedConvention.signatories.beneficiaryRepresentative.phone,
                deps.timeGateway.now(),
              )
            : undefined,
          beneficiaryCurrentEmployer: updatedConvention.signatories
            .beneficiaryCurrentEmployer
            ? await uow.phoneNumberRepository.getIdByPhoneNumber(
                updatedConvention.signatories.beneficiaryCurrentEmployer.phone,
                deps.timeGateway.now(),
              )
            : undefined,
        },
      }),
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
  });
