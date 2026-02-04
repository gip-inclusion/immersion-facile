import {
  type ConnectedUser,
  type ConventionDto,
  conventionSchema,
  type EditBeneficiaryBirthdateRequestDto,
  editBeneficiaryBirthdateRequestSchema,
  errors,
} from "shared";
import { throwErrorIfConventionStatusNotAllowed } from "../../../utils/convention";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type EditBeneficiaryBirthdate = ReturnType<
  typeof makeEditBeneficiaryBirthdate
>;

export const makeEditBeneficiaryBirthdate = useCaseBuilder(
  "EditBeneficiaryBirthdate",
)
  .withInput<EditBeneficiaryBirthdateRequestDto>(
    editBeneficiaryBirthdateRequestSchema,
  )
  .withOutput<void>()
  .withCurrentUser<ConnectedUser>()
  .withDeps<{
    createNewEvent: CreateNewEvent;
  }>()
  .build(async ({ inputParams, uow, deps, currentUser }) => {
    throwIfNotAdmin(currentUser);
    const convention = await uow.conventionRepository.getById(
      inputParams.conventionId,
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: inputParams.conventionId,
      });

    throwErrorIfConventionStatusNotAllowed(
      convention.status,
      ["ACCEPTED_BY_VALIDATOR"],
      errors.convention.editBeneficiaryBirthdateNotAllowedForStatus({
        status: convention.status,
      }),
    );

    const updatedConvention: ConventionDto =
      convention.internshipKind === "mini-stage-cci"
        ? {
            ...convention,
            signatories: {
              ...convention.signatories,
              beneficiary: {
                ...convention.signatories.beneficiary,
                birthdate: inputParams.updatedBeneficiaryBirthDate,
              },
            },
          }
        : {
            ...convention,
            signatories: {
              ...convention.signatories,
              beneficiary: {
                ...convention.signatories.beneficiary,
                birthdate: inputParams.updatedBeneficiaryBirthDate,
              },
            },
          };

    const conventionValidation = conventionSchema.safeParse(updatedConvention);
    if (!conventionValidation.success) {
      throw errors.convention.invalidConventionAfterBirthdateUpdate({
        message: conventionValidation.error.issues[0].message,
      });
    }

    await Promise.all([
      uow.conventionRepository.update(updatedConvention),
      uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "ConventionBeneficiaryBirthdateEdited",
          payload: {
            convention: updatedConvention,
            triggeredBy: {
              kind: "connected-user",
              userId: currentUser.id,
            },
          },
        }),
      ),
    ]);
  });
