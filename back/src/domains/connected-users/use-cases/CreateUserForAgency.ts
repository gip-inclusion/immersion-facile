import { keys } from "ramda";
import {
  type ConnectedUser,
  errors,
  type UserParamsForAgency,
  userParamsForAgencySchema,
} from "shared";
import { getAgencyRightByUserId } from "../../../utils/agency";
import type { DashboardGateway } from "../../core/dashboard/port/DashboardGateway";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import { throwIfNotAgencyAdminOrBackofficeAdmin } from "../helpers/authorization.helper";
import { getUserByEmailAndCreateIfMissing } from "../helpers/connectedUser.helper";

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

    const user = await getUserByEmailAndCreateIfMissing({
      userRepository: uow.userRepository,
      timeGateway: deps.timeGateway,
      userIdIfNew: inputParams.userId, //Cet id provient du front. Comment le front le génère? Pourquoi on le gènere pas dans le back vu qu'on check l'existence par email?
      userEmail: inputParams.email,
    });

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
