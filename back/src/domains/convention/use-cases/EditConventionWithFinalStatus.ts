import {
  type ConnectedUser,
  type ConventionDto,
  conventionSchema,
  conventionStatuses,
  conventionStatusesAllowedForModification,
  type EditConventionWithFinalStatusRequestDto,
  editConventionWithFinalStatusRequestSchema,
  errors,
} from "shared";
import { throwErrorIfConventionStatusNotAllowed } from "../../../utils/convention";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { useCaseBuilder } from "../../core/useCaseBuilder";

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
      conventionStatuses.filter(
        (status) => !conventionStatusesAllowedForModification.includes(status),
      ),
      errors.convention.editConventionWithFinalStatusNotAllowedForStatus({
        status: convention.status,
      }),
    );

    const updatedConventionCandidate = {
      ...convention,
      signatories: {
        ...convention.signatories,
        beneficiary: {
          ...convention.signatories.beneficiary,
          ...(inputParams.updatedBeneficiaryBirthDate && {
            birthdate: inputParams.updatedBeneficiaryBirthDate,
          }),
          ...(inputParams.firstname && {
            firstName: inputParams.firstname,
          }),
          ...(inputParams.lastname && {
            lastName: inputParams.lastname,
          }),
        },
      },
    };

    const conventionValidation = conventionSchema.safeParse(
      updatedConventionCandidate,
    );
    if (!conventionValidation.success)
      throw errors.convention.invalidConventionAfterFinalStatusEdit({
        message: conventionValidation.error.issues[0].message,
      });

    const updatedConvention: ConventionDto = conventionValidation.data;

    await Promise.all([
      uow.conventionRepository.update(updatedConvention),
      uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "ConventionWithFinalStatusEdited",
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
