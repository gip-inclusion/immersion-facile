import {
  AgencyRight,
  InclusionConnectedUser,
  UserParamsForAgency,
  errors,
  userParamsForAgencySchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { DomainEvent } from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

export type CreateUserForAgency = ReturnType<typeof makeCreateUserForAgency>;

export const makeCreateUserForAgency = createTransactionalUseCase<
  UserParamsForAgency,
  InclusionConnectedUser,
  InclusionConnectedUser,
  { timeGateway: TimeGateway; createNewEvent: CreateNewEvent }
>(
  {
    name: "CreateUserForAgency",
    inputSchema: userParamsForAgencySchema,
  },
  async ({ inputParams, uow, currentUser, deps }) => {
    throwIfNotAdmin(currentUser);
    const agency = await uow.agencyRepository.getById(inputParams.agencyId);
    if (!agency)
      throw errors.agency.notFound({ agencyId: inputParams.agencyId });

    if (agency.refersToAgencyId && inputParams.roles.includes("validator"))
      throw errors.agency.invalidRoleUpdateForAgencyWithRefersTo({
        agencyId: agency.id,
        role: "validator",
      });

    const provider = oAuthProviderByFeatureFlags(
      await uow.featureFlagRepository.getAll(),
    );
    const existingUser = (
      await uow.userRepository.getIcUsersWithFilter(
        {
          email: inputParams.email,
        },
        provider,
      )
    ).at(0);

    if (!existingUser) {
      await uow.userRepository.save(
        {
          createdAt: deps.timeGateway.now().toISOString(),
          email: inputParams.email,
          externalId: null,
          firstName: "",
          id: inputParams.userId,
          lastName: "",
        },
        provider,
      );
    }

    const existingUserAgencyRights = existingUser?.agencyRights ?? [];
    const userId = existingUser?.id ?? inputParams.userId;
    const agencyRight: AgencyRight = {
      roles: inputParams.roles,
      isNotifiedByEmail: inputParams.isNotifiedByEmail,
      agency,
    };

    const event: DomainEvent = deps.createNewEvent({
      topic: "IcUserAgencyRightChanged",
      payload: {
        ...inputParams,
        userId,
        triggeredBy: {
          kind: "inclusion-connected",
          userId: currentUser.id,
        },
      },
    });

    await Promise.all([
      uow.userRepository.updateAgencyRights({
        userId,
        agencyRights: [...existingUserAgencyRights, agencyRight],
      }),
      uow.outboxRepository.save(event),
    ]);

    const user = await uow.userRepository.getById(userId, provider);

    if (!user) throw errors.user.notFound({ userId }); //should not happen

    return user;
  },
);
