import {
  type AgencyDto,
  type AgencyId,
  agencyIdSchema,
  type ConnectedUser,
  errors,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { throwIfNotAgencyAdminOrBackofficeAdmin } from "../../connected-users/helpers/authorization.helper";
import { createTransactionalUseCase } from "../../core/UseCase";

export type GetAgencyById = ReturnType<typeof makeGetAgencyById>;
export const makeGetAgencyById = createTransactionalUseCase<
  AgencyId,
  AgencyDto,
  ConnectedUser
>(
  {
    name: "GetAgencyById",
    inputSchema: agencyIdSchema,
  },
  async ({ uow, currentUser, inputParams }) => {
    const agency = await uow.agencyRepository.getById(inputParams);

    if (!agency) throw errors.agency.notFound({ agencyId: inputParams });

    throwIfNotAgencyAdminOrBackofficeAdmin(agency.id, currentUser);

    return agencyWithRightToAgencyDto(uow, agency);
  },
);
