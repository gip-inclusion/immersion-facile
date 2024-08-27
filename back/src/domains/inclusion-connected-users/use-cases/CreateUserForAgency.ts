import {
  AgencyRight,
  InclusionConnectedUser,
  UserCreateParamsForAgency,
  errors,
  userCreateParamsForAgencySchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

export type CreateUserForAgency = ReturnType<typeof makeCreateUserForAgency>;

export const makeCreateUserForAgency = createTransactionalUseCase<
  UserCreateParamsForAgency,
  void,
  InclusionConnectedUser,
  { timeGateway: TimeGateway; uuidGenerator: UuidGenerator }
>(
  {
    name: "CreateUserForAgency",
    inputSchema: userCreateParamsForAgencySchema,
  },
  async ({
    inputParams: { agencyId, email, isNotifiedByEmail, roles, userId },
    uow,
    currentUser,
    deps,
  }) => {
    throwIfNotAdmin(currentUser);
    const agency = await uow.agencyRepository.getById(agencyId);
    if (!agency) throw errors.agency.notFound({ agencyId });

    if (agency.refersToAgencyId && roles.includes("validator"))
      throw errors.agency.invalidRoleUpdateForAgencyWithRefersTo({
        agencyId: agency.id,
        role: "validator",
      });

    const existingUser = await uow.userRepository.getById(userId);

    if (!existingUser) {
      await uow.userRepository.save({
        createdAt: deps.timeGateway.now().toISOString(),
        email,
        externalId: null,
        firstName: "",
        id: userId,
        lastName: "",
      });
    }

    const existingUserAgencyRights = existingUser?.agencyRights ?? [];
    const agencyRight: AgencyRight = {
      roles,
      isNotifiedByEmail: isNotifiedByEmail,
      agency,
    };
    await uow.userRepository.updateAgencyRights({
      userId: userId,
      agencyRights: [...existingUserAgencyRights, agencyRight],
    });
  },
);
