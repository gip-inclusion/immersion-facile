import { keys } from "ramda";
import {
  type ConnectedUser,
  errors,
  type User,
  type UserParamsForAgency,
  userParamsForAgencySchema,
} from "shared";
import { getAgencyRightByUserId } from "../../../utils/agency";
import { emptyName } from "../../core/authentication/connected-user/entities/user.helper";
import type { DashboardGateway } from "../../core/dashboard/port/DashboardGateway";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { throwIfNotAgencyAdminOrBackofficeAdmin } from "../helpers/authorization.helper";

export type CreateUserForAgency = ReturnType<typeof makeCreateUserForAgency>;

export const makeCreateUserForAgency = useCaseBuilder("CreateUserForAgency")
  .withInput<UserParamsForAgency>(userParamsForAgencySchema)
  .withOutput<ConnectedUser>()
  .withCurrentUser<ConnectedUser>()
  .withDeps<{
    timeGateway: TimeGateway;
    createNewEvent: CreateNewEvent;
    dashboardGateway: DashboardGateway;
  }>()
  .build(async ({ inputParams, uow, currentUser, deps }) => {
    throwIfNotAgencyAdminOrBackofficeAdmin(inputParams.agencyId, currentUser);

    const agency = await uow.agencyRepository.getById(inputParams.agencyId);
    if (!agency)
      throw errors.agency.notFound({ agencyId: inputParams.agencyId });

    if (agency.refersToAgencyId && inputParams.roles.includes("validator"))
      throw errors.agency.invalidRoleUpdateForAgencyWithRefersTo({
        agencyId: agency.id,
        role: "validator",
      });

    const user = await getUserByEmailAndCreateIfMissing(
      uow,
      deps.timeGateway,
      inputParams,
    );

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
          topic: "ConnectedUserAgencyRightChanged",
          payload: {
            agencyId: agency.id,
            userId: user.id,
            triggeredBy: {
              kind: "connected-user",
              userId: currentUser.id,
            },
          },
        }),
      ),
    ]);

    return {
      ...user,
      agencyRights: await getAgencyRightByUserId(uow, user.id),
      dashboards: { agencies: {}, establishments: {} },
    };
  });

const getUserByEmailAndCreateIfMissing = async (
  uow: UnitOfWork,
  timeGateway: TimeGateway,
  inputParams: UserParamsForAgency,
): Promise<User> =>
  (await uow.userRepository.findByEmail(inputParams.email)) ||
  (await saveAndProvideNewUser(uow, {
    id: inputParams.userId, //Cet id provient du front. Comment le front le génère? Pourquoi on le gènere pas dans le back vu qu'on check l'existance par email?
    email: inputParams.email,
    createdAt: timeGateway.now().toISOString(),
    firstName: emptyName,
    lastName: emptyName,
    proConnect: null,
  }));

const saveAndProvideNewUser = async (uow: UnitOfWork, newUser: User) => {
  await uow.userRepository.save(newUser);
  return newUser;
};
