import {
  AgencyRight,
  InclusionConnectedUser,
  UserCreateParamsForAgency,
  errors,
  userCreateParamsForAgencySchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import { DomainEvent } from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

export type CreateUserForAgency = ReturnType<typeof makeCreateUserForAgency>;

export const makeCreateUserForAgency = createTransactionalUseCase<
  UserCreateParamsForAgency,
  void,
  InclusionConnectedUser,
  { timeGateway: TimeGateway; createNewEvent: CreateNewEvent }
>(
  {
    name: "CreateUserForAgency",
    inputSchema: userCreateParamsForAgencySchema,
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

    const existingUser = await uow.userRepository.getById(inputParams.userId);

    if (!existingUser) {
      await uow.userRepository.save({
        createdAt: deps.timeGateway.now().toISOString(),
        email: inputParams.email,
        externalId: null,
        firstName: "",
        id: inputParams.userId,
        lastName: "",
      });
    }

    const existingUserAgencyRights = existingUser?.agencyRights ?? [];
    const agencyRight: AgencyRight = {
      roles: inputParams.roles,
      isNotifiedByEmail: inputParams.isNotifiedByEmail,
      agency,
    };

    const event: DomainEvent = deps.createNewEvent({
      topic: "IcUserAgencyRightChanged",
      payload: {
        ...inputParams,
        triggeredBy: {
          kind: "inclusion-connected",
          userId: currentUser.id,
        },
      },
    });

    await Promise.all([
      uow.userRepository.updateAgencyRights({
        userId: inputParams.userId,
        agencyRights: [...existingUserAgencyRights, agencyRight],
      }),
      uow.outboxRepository.save(event),
    ]);
  },
);
