import {
  AgencyDto,
  AgencyId,
  InclusionConnectedUser,
  agencyIdSchema,
  errors,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { createTransactionalUseCase } from "../../core/UseCase";
import { throwIfNotAgencyAdminOrBackofficeAdmin } from "../../inclusion-connected-users/helpers/authorization.helper";

export type GetAgencyById = ReturnType<typeof makeGetAgencyById>;
export const makeGetAgencyById = createTransactionalUseCase<
  AgencyId,
  AgencyDto,
  InclusionConnectedUser
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
