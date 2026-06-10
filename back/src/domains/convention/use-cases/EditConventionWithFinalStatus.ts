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
import {
  throwIfNotAdmin,
  throwIfNotAuthorizedForRole,
} from "../../connected-users/helpers/authorization.helper";
import { getUserWithRights } from "../../connected-users/helpers/userRights.helper";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { throwErrorOnConventionIdMismatch } from "../entities/Convention";

export type EditConventionWithFinalStatus = ReturnType<
  typeof makeEditConventionWithFinalStatus
>;

const hasAtLeastOneDefinedValueInPartialUpdate = (
  values: Record<string, unknown> | undefined,
): boolean =>
  values !== undefined &&
  Object.values(values).some((value) => value !== undefined);

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

    if (
      !hasAtLeastOneDefinedValueInPartialUpdate(
        inputParams.establishmentTutor,
      ) &&
      !hasAtLeastOneDefinedValueInPartialUpdate(inputParams.beneficiary)
    )
      return;

    const updatedEstablishmentTutor = inputParams.establishmentTutor
      ? {
          ...convention.establishmentTutor,
          ...(inputParams.establishmentTutor.firstname !== undefined && {
            firstName: inputParams.establishmentTutor.firstname,
          }),
          ...(inputParams.establishmentTutor.lastname !== undefined && {
            lastName: inputParams.establishmentTutor.lastname,
          }),
          ...(inputParams.establishmentTutor.job !== undefined && {
            job: inputParams.establishmentTutor.job,
          }),
          ...(inputParams.establishmentTutor.email !== undefined && {
            email: inputParams.establishmentTutor.email,
          }),
          ...(inputParams.establishmentTutor.phone !== undefined && {
            phone: inputParams.establishmentTutor.phone,
          }),
        }
      : convention.establishmentTutor;

    const updatedBeneficiary = inputParams.beneficiary
      ? {
          ...convention.signatories.beneficiary,
          ...(inputParams.beneficiary.updatedBeneficiaryBirthDate !==
            undefined && {
            birthdate: inputParams.beneficiary.updatedBeneficiaryBirthDate,
          }),
          ...(inputParams.beneficiary.firstname !== undefined && {
            firstName: inputParams.beneficiary.firstname,
          }),
          ...(inputParams.beneficiary.lastname !== undefined && {
            lastName: inputParams.beneficiary.lastname,
          }),
        }
      : convention.signatories.beneficiary;

    const updatedConvention = {
      ...convention,
      establishmentTutor: updatedEstablishmentTutor,
      ...(inputParams.beneficiary
        ? {
            signatories: {
              ...convention.signatories,
              beneficiary: updatedBeneficiary,
            },
          }
        : {}),
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
    throw errors.convention.unsupportedRole({ role: jwtPayload.role });

  const userWithRights = await getUserWithRights(uow, jwtPayload.userId);

  throwIfNotAdmin(userWithRights);
};
