import {
  allowedRolesToEditConventionWithFinalStatus,
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  conventionSchema,
  conventionStatuses,
  conventionStatusesAllowedForModification,
  type EditConventionWithFinalStatusRequestDto,
  editConventionWithFinalStatusRequestSchema,
  errors,
} from "shared";
import {
  conventionDtoToConventionReadDto,
  throwErrorIfConventionStatusNotAllowed,
} from "../../../utils/convention";
import { throwIfNotAuthorizedForRole } from "../../connected-users/helpers/authorization.helper";
import { getUserWithRights } from "../../connected-users/helpers/userRights.helper";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { throwErrorOnConventionIdMismatch } from "../entities/Convention";

export type EditConventionWithFinalStatus = ReturnType<
  typeof makeEditConventionWithFinalStatus
>;

export const makeEditConventionWithFinalStatus = useCaseBuilder(
  "EditConventionWithFinalStatus",
)
  .withInput<EditConventionWithFinalStatusRequestDto>(
    editConventionWithFinalStatusRequestSchema,
  )
  .withOutput<void>()
  .withCurrentUser<ConventionRelatedJwtPayload>()
  .withDeps<{
    createNewEvent: CreateNewEvent;
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
      conventionStatuses.filter(
        (status) => !conventionStatusesAllowedForModification.includes(status),
      ),
      errors.convention.editConventionWithFinalStatusNotAllowedForStatus({
        status: convention.status,
        conventionId: convention.id,
      }),
    );

    const conventionRead = await conventionDtoToConventionReadDto(
      convention,
      uow,
    );

    if (inputParams.beneficiary) {
      await throwIfNotAllowedToEditBeneficiary({
        uow,
        jwtPayload,
        hasBeneficiaryUpdate: !!inputParams.beneficiary,
      });
    }

    await throwIfNotAuthorizedForRole({
      uow,
      jwtPayload,
      convention: conventionRead,
      authorizedRoles: [...allowedRolesToEditConventionWithFinalStatus],
      errorToThrow:
        errors.convention.editConventionWithFinalStatusNotAuthorizedForRole(),
      isPeAdvisorAllowed: true,
      isValidatorOfAgencyRefersToAllowed: true,
    });

    const updatedEstablishmentTutor = {
      ...convention.establishmentTutor,
      firstName: inputParams.establishmentTutor.firstname,
      lastName: inputParams.establishmentTutor.lastname,
      job: inputParams.establishmentTutor.job,
      email: inputParams.establishmentTutor.email,
      phone: inputParams.establishmentTutor.phone,
    };

    const updatedConvention = inputParams.beneficiary
      ? {
          ...convention,
          establishmentTutor: updatedEstablishmentTutor,
          signatories: {
            ...convention.signatories,
            beneficiary: {
              ...convention.signatories.beneficiary,
              birthdate: inputParams.beneficiary.updatedBeneficiaryBirthDate,
              firstName: inputParams.beneficiary.firstname,
              lastName: inputParams.beneficiary.lastname,
            },
          },
        }
      : {
          ...convention,
          establishmentTutor: updatedEstablishmentTutor,
        };

    const conventionValidation = conventionSchema.safeParse(updatedConvention);
    if (!conventionValidation.success)
      throw errors.convention.invalidConventionAfterFinalStatusEdit({
        message: conventionValidation.error.issues
          .map((issue) => issue.message)
          .join("; "),
        conventionId: convention.id,
      });

    const parsedUpdatedConvention: ConventionDto = conventionValidation.data;

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

    await uow.conventionRepository.update(parsedUpdatedConvention);
    await uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "ConventionWithFinalStatusEdited",
        payload: {
          convention: parsedUpdatedConvention,
          triggeredBy,
        },
      }),
    );
  });

const throwIfNotAllowedToEditBeneficiary = async ({
  uow,
  jwtPayload,
  hasBeneficiaryUpdate,
}: {
  uow: UnitOfWork;
  jwtPayload: ConventionRelatedJwtPayload;
  hasBeneficiaryUpdate: boolean;
}) => {
  if (!hasBeneficiaryUpdate) return;

  if (!("userId" in jwtPayload))
    throw errors.convention.editConventionWithFinalStatusBeneficiaryForbiddenForRole();

  const userWithRights = await getUserWithRights(uow, jwtPayload.userId);

  if (!userWithRights.isBackofficeAdmin)
    throw errors.convention.editConventionWithFinalStatusBeneficiaryForbiddenForRole();
};
