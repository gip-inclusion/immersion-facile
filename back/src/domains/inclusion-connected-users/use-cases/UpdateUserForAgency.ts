import {
  Email,
  InclusionConnectedUser,
  UserParamsForAgency,
  errors,
  userParamsForAgencySchema,
} from "shared";
import { AgencyUsersRights } from "../../agency/ports/AgencyRepository";
import { TransactionalUseCase } from "../../core/UseCase";
import { UserRepository } from "../../core/authentication/inclusion-connect/port/UserRepository";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import {
  rejectIfEditionOfValidatorsOfAgencyWithRefersTo,
  validateAgencyRights,
} from "../helpers/agencyRights.helper";
import { getIcUserByUserId } from "../helpers/inclusionConnectedUser.helper";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

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

    const agencyRightToUpdate = agency.usersRights[userToUpdate.id];
    if (!agencyRightToUpdate)
      throw errors.user.noRightsOnAgency({
        agencyId: agency.id,
        userId: userToUpdate.id,
      });
    rejectIfEditionOfValidatorsOfAgencyWithRefersTo(params, agency);
    rejectEmailModificationIfInclusionConnectedUser(userToUpdate, params.email);

    const updatedRights: AgencyUsersRights = {
      ...agency.usersRights,
      [userToUpdate.id]: {
        roles: params.roles,
        isNotifiedByEmail: params.isNotifiedByEmail,
      },
    };

    validateAgencyRights(agency.id, updatedRights);

    await Promise.all([
      uow.agencyRepository.update({
        id: agency.id,
        usersRights: updatedRights,
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
