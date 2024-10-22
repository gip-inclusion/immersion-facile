import {
  AgencyPublicDisplayDto,
  WithAgencyId,
  errors,
  toAgencyPublicDisplayDto,
  withAgencyIdSchema,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export class GetAgencyPublicInfoById extends TransactionalUseCase<
  WithAgencyId,
  AgencyPublicDisplayDto
> {
  protected inputSchema = withAgencyIdSchema;

  public async _execute(
    { agencyId }: WithAgencyId,
    uow: UnitOfWork,
  ): Promise<AgencyPublicDisplayDto> {
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
  }
}
