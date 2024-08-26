import {
  AgencyDto,
  AgencyRight,
  UserUpdateParamsForAgency,
  InclusionConnectedUser,
  errors,
  userUpdateParamsForAgencySchema,
  replaceElementWhere,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { DomainEvent } from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

const rejectIfAgencyWontHaveValidators = async (
  uow: UnitOfWork,
  params: UserUpdateParamsForAgency,
  agency: AgencyDto,
) => {
  if (
    (!params.roles.includes("validator") || !params.isNotifiedByEmail) &&
    agency.refersToAgencyId === null
  ) {
    const agencyUsers = await uow.userRepository.getWithFilter({
      agencyId: params.agencyId,
    });

    const agencyHasOtherValidator = agencyUsers.some(
      (agencyUser) =>
        agencyUser.id !== params.userId &&
        agencyUser.agencyRights.some(
          (right) =>
            right.isNotifiedByEmail && right.roles.includes("validator"),
        ),
    );

    if (!agencyHasOtherValidator)
      throw errors.agency.notEnoughValidators({ agencyId: params.agencyId });
  }
};

const rejectIfOneStepValidationAgencyWontHaveValidatorsReceivingEmails = async (
  params: UserUpdateParamsForAgency,
  agency: AgencyDto,
) => {
  if (
    agency.counsellorEmails.length === 0 &&
    params.roles.includes("counsellor")
  ) {
    throw errors.agency.invalidRoleUpdateForOneStepValidationAgency({
      agencyId: params.agencyId,
      role: "counsellor",
    });
  }
};

const rejectIfAgencyWithRefersToWontHaveCounsellors = async (
  uow: UnitOfWork,
  params: UserUpdateParamsForAgency,
  agency: AgencyDto,
) => {
  if (
    (!params.roles.includes("counsellor") || !params.isNotifiedByEmail) &&
    agency.refersToAgencyId
  ) {
    const agencyUsers = await uow.userRepository.getWithFilter({
      agencyId: params.agencyId,
    });

    const agencyHasOtherCounsellor = agencyUsers.some(
      (agencyUser) =>
        agencyUser.id !== params.userId &&
        agencyUser.agencyRights.some(
          (right) =>
            right.isNotifiedByEmail && right.roles.includes("counsellor"),
        ),
    );

    if (!agencyHasOtherCounsellor)
      throw errors.agency.notEnoughCounsellors({ agencyId: params.agencyId });
  }
};

const makeAgencyRights = async (
  uow: UnitOfWork,
  params: UserUpdateParamsForAgency,
  userToUpdate: InclusionConnectedUser,
) => {
  const agency = await uow.agencyRepository.getById(params.agencyId);

  if (!agency) throw errors.agency.notFound({ agencyId: params.agencyId });

  const agencyRightToUpdate = userToUpdate.agencyRights.find(
    ({ agency }) => agency.id === params.agencyId,
  );

  if (!agencyRightToUpdate)
    throw errors.user.noRightsOnAgency({
      agencyId: params.agencyId,
      userId: params.userId,
    });

  await rejectIfOneStepValidationAgencyWontHaveValidatorsReceivingEmails(
    params,
    agency,
  );
  await rejectIfAgencyWontHaveValidators(uow, params, agency);
  await rejectIfAgencyWithRefersToWontHaveCounsellors(uow, params, agency);

  const updatedAgencyRight: AgencyRight = {
    ...agencyRightToUpdate,
    roles: params.roles,
    isNotifiedByEmail: params.isNotifiedByEmail,
  };

  const newAgencyRights = replaceElementWhere(
    userToUpdate.agencyRights,
    updatedAgencyRight,
    ({ agency }) => agency.id === params.agencyId,
  );

  return newAgencyRights;
};

export class UpdateUserForAgency extends TransactionalUseCase<
  UserUpdateParamsForAgency,
  void,
  InclusionConnectedUser
> {
  protected inputSchema = userUpdateParamsForAgencySchema;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(
    params: UserUpdateParamsForAgency,
    uow: UnitOfWork,
    currentUser: InclusionConnectedUser,
  ): Promise<void> {
    throwIfNotAdmin(currentUser);
    const userToUpdate = await uow.userRepository.getById(params.userId);
    if (!userToUpdate) throw errors.user.notFound({ userId: params.userId });

    const newAgencyRights = await makeAgencyRights(uow, params, userToUpdate);

    const event: DomainEvent = this.#createNewEvent({
      topic: "IcUserAgencyRightChanged",
      payload: {
        ...params,
        triggeredBy: {
          kind: "inclusion-connected",
          userId: currentUser.id,
        },
      },
    });

    await Promise.all([
      uow.userRepository.updateAgencyRights({
        userId: params.userId,
        agencyRights: newAgencyRights,
      }),
      uow.outboxRepository.save(event),
    ]);
  }
}
