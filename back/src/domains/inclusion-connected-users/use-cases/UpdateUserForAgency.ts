import { values } from "ramda";
import {
  Email,
  InclusionConnectedUser,
  UserParamsForAgency,
  errors,
  userParamsForAgencySchema,
} from "shared";
import {
  AgencyUsersRights,
  AgencyWithUsersRights,
} from "../../agency/ports/AgencyRepository";
import { TransactionalUseCase } from "../../core/UseCase";
import { UserRepository } from "../../core/authentication/inclusion-connect/port/UserRepository";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { getIcUserByUserId } from "../helpers/inclusionConnectedUser.helper";
import {
  throwIfAgencyDontHaveOtherCounsellorsReceivingNotifications,
  throwIfAgencyDontHaveOtherValidatorsReceivingNotifications,
} from "../helpers/throwIfAgencyWontHaveEnoughCounsellorsOrValidators";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

const rejectIfAgencyWontHaveValidatorsReceivingNotifications = (
  params: UserParamsForAgency,
  agency: AgencyWithUsersRights,
): void => {
  if (!params.roles.includes("validator") || !params.isNotifiedByEmail) {
    throwIfAgencyDontHaveOtherValidatorsReceivingNotifications(
      agency,
      params.userId,
    );
  }
};

const rejectIfOneStepValidationAgencyWontHaveValidatorsReceivingEmails = (
  params: UserParamsForAgency,
  agency: AgencyWithUsersRights,
): void => {
  if (!hasCounsellors(agency) && params.roles.includes("counsellor")) {
    throw errors.agency.invalidRoleUpdateForOneStepValidationAgency({
      agencyId: params.agencyId,
      role: "counsellor",
    });
  }
};

const rejectIfAgencyWithRefersToWontHaveCounsellors = (
  params: UserParamsForAgency,
  agency: AgencyWithUsersRights,
): void => {
  if (!params.roles.includes("counsellor") || !params.isNotifiedByEmail) {
    throwIfAgencyDontHaveOtherCounsellorsReceivingNotifications(
      agency,
      params.userId,
    );
  }
};

const makeAgencyRights = (
  agency: AgencyWithUsersRights,
  params: UserParamsForAgency,
  userToUpdate: InclusionConnectedUser,
): AgencyUsersRights => {
  const agencyRightToUpdate = userToUpdate.agencyRights.find(
    ({ agency }) => agency.id === params.agencyId,
  );

  if (!agencyRightToUpdate)
    throw errors.user.noRightsOnAgency({
      agencyId: params.agencyId,
      userId: params.userId,
    });

  rejectIfOneStepValidationAgencyWontHaveValidatorsReceivingEmails(
    params,
    agency,
  );
  rejectIfAgencyWontHaveValidatorsReceivingNotifications(params, agency);
  //pourquoi 2 fois ?
  rejectIfAgencyWithRefersToWontHaveCounsellors(params, agency);
  rejectIfAgencyWithRefersToWontHaveCounsellors(params, agency);

  return {
    ...agency.usersRights,
    [userToUpdate.id]: {
      roles: params.roles,
      isNotifiedByEmail: params.isNotifiedByEmail,
    },
  };
};

const rejectEmailModificationIfInclusionConnectedUser = (
  user: InclusionConnectedUser,
  newEmail: Email,
): void => {
  if (!newEmail || !user.externalId) return;
  if (user.email !== newEmail) {
    throw errors.user.forbiddenToChangeEmailForUIcUser();
  }
};

const updateIfUserEmailChanged = async (
  user: InclusionConnectedUser,
  newEmail: Email,
  userRepository: UserRepository,
): Promise<void> => {
  if (user.email === newEmail || user.externalId) return;
  await userRepository.updateEmail(user.id, newEmail);
};
export class UpdateUserForAgency extends TransactionalUseCase<
  UserParamsForAgency,
  void,
  InclusionConnectedUser
> {
  protected inputSchema = userParamsForAgencySchema;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(
    params: UserParamsForAgency,
    uow: UnitOfWork,
    currentUser: InclusionConnectedUser,
  ): Promise<void> {
    throwIfNotAdmin(currentUser);
    const userToUpdate = await getIcUserByUserId(uow, params.userId);
    if (!userToUpdate) throw errors.user.notFound({ userId: params.userId });

    const agency = await uow.agencyRepository.getById(params.agencyId);
    if (!agency) throw errors.agency.notFound({ agencyId: params.agencyId });

    const usersRights = makeAgencyRights(agency, params, userToUpdate);
    rejectEmailModificationIfInclusionConnectedUser(userToUpdate, params.email);

    await Promise.all([
      uow.agencyRepository.update({
        id: agency.id,
        usersRights,
      }),
      updateIfUserEmailChanged(userToUpdate, params.email, uow.userRepository),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "IcUserAgencyRightChanged",
          payload: {
            ...params,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: currentUser.id,
            },
          },
        }),
      ),
    ]);
  }
}
const hasCounsellors = (agency: AgencyWithUsersRights) =>
  values(agency.usersRights).some((userRight) =>
    userRight?.roles.includes("counsellor"),
  );
