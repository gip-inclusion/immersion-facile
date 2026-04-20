import {
  type AgencyPublicDisplayDto,
  errors,
  toAgencyPublicDisplayDto,
  withAgencyIdSchema,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type GetAgencyPublicInfoById = ReturnType<
  typeof makeGetAgencyPublicInfoById
>;

export const makeGetAgencyPublicInfoById = useCaseBuilder(
  "GetAgencyPublicInfoById",
)
  .withInput(withAgencyIdSchema)
  .withOutput<AgencyPublicDisplayDto>()
  .build(async ({ inputParams: { agencyId }, uow }) => {
    const agencyWithRights = await uow.agencyRepository.getById(agencyId);
    if (!agencyWithRights) throw errors.agency.notFound({ agencyId });
    const referedAgency =
      agencyWithRights.refersToAgencyId &&
      (await uow.agencyRepository.getById(agencyWithRights.refersToAgencyId));

    return toAgencyPublicDisplayDto(
      await agencyWithRightToAgencyDto(uow, agencyWithRights),
      referedAgency
        ? await agencyWithRightToAgencyDto(uow, referedAgency)
        : null,
    );
  });
