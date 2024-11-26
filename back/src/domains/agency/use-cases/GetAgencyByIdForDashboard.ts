import {
  AgencyDto,
  AgencyId,
  InclusionConnectedUser,
  agencyIdSchema,
  errors,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { createTransactionalUseCase } from "../../core/UseCase";

export type GetAgencyByIdForDashboard = ReturnType<
  typeof makeGetAgencyByIdForDashboard
>;
export const makeGetAgencyByIdForDashboard = createTransactionalUseCase<
  AgencyId,
  AgencyDto,
  InclusionConnectedUser
>(
  {
    name: "GetAgencyByIdForDashboard",
    inputSchema: agencyIdSchema,
  },
  async ({ uow, currentUser, inputParams }) => {
    const agency = await uow.agencyRepository.getById(inputParams);

    if (!agency) throw errors.agency.notFound({ agencyId: inputParams });

    const isUserAdminOnAgency = currentUser.agencyRights.some(
      (agencyRight) =>
        agencyRight.agency.id === inputParams &&
        agencyRight.roles.includes("agency-admin"),
    );
    if (!isUserAdminOnAgency)
      throw errors.user.notAdminOnAgency({
        userId: currentUser.id,
        agencyId: inputParams,
      });

    return agencyWithRightToAgencyDto(uow, agency);
  },
);
