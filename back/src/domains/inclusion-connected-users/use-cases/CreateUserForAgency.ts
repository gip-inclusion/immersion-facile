import { keys } from "ramda";
import {
  type InclusionConnectedUser,
  type User,
  type UserParamsForAgency,
  errors,
  userParamsForAgencySchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import { emptyName } from "../../core/authentication/inclusion-connect/entities/user.helper";
import type { DashboardGateway } from "../../core/dashboard/port/DashboardGateway";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { throwIfNotAgencyAdminOrBackofficeAdmin } from "../helpers/authorization.helper";
import { getIcUserByUserId } from "../helpers/inclusionConnectedUser.helper";

export type CreateUserForAgency = ReturnType<typeof makeCreateUserForAgency>;

export const makeCreateUserForAgency = createTransactionalUseCase<
  UserParamsForAgency,
  InclusionConnectedUser,
  InclusionConnectedUser,
  {
    timeGateway: TimeGateway;
    createNewEvent: CreateNewEvent;
    dashboardGateway: DashboardGateway;
  }
>(
  {
    name: "CreateUserForAgency",
    inputSchema: userParamsForAgencySchema,
  },
  async ({ inputParams, uow, currentUser, deps }) => {
    throwIfNotAgencyAdminOrBackofficeAdmin(inputParams.agencyId, currentUser);

    const agency = await uow.agencyRepository.getById(inputParams.agencyId);
    if (!agency)
      throw errors.agency.notFound({ agencyId: inputParams.agencyId });

    if (agency.refersToAgencyId && inputParams.roles.includes("validator"))
      throw errors.agency.invalidRoleUpdateForAgencyWithRefersTo({
        agencyId: agency.id,
        role: "validator",
      });

    const user = await getUserIdAndCreateIfMissing(uow, inputParams, deps);

    const isUserAlreadyLinkedToAgency = keys(agency.usersRights).some(
      (id) => id === user.id,
    );
    if (isUserAlreadyLinkedToAgency) throw errors.agency.userAlreadyExist();

    await Promise.all([
      uow.agencyRepository.update({
        id: agency.id,
        usersRights: {
          ...agency.usersRights,
          [user.id]: {
            roles: inputParams.roles,
            isNotifiedByEmail: inputParams.isNotifiedByEmail,
          },
        },
      }),
      uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "IcUserAgencyRightChanged",
          payload: {
            agencyId: agency.id,
            userId: user.id,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: currentUser.id,
            },
          },
        }),
      ),
    ]);

    return getIcUserByUserId(
      uow,
      user.id,
      deps.dashboardGateway,
      deps.timeGateway,
    );
  },
);

const getUserIdAndCreateIfMissing = async (
  uow: UnitOfWork,
  inputParams: UserParamsForAgency,
  deps: { timeGateway: TimeGateway; createNewEvent: CreateNewEvent },
): Promise<User> => {
  const existingUser = await uow.userRepository.findByEmail(inputParams.email);
  if (existingUser) return existingUser;

  const newUser: User = {
    id: inputParams.userId,
    email: inputParams.email,
    createdAt: deps.timeGateway.now().toISOString(),
    firstName: emptyName,
    lastName: emptyName,
    externalId: null,
  };
  await uow.userRepository.save(newUser);
  return newUser;
};
