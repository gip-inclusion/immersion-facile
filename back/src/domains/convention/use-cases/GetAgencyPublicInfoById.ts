import {
  AgencyPublicDisplayDto,
  WithAgencyId,
  toAgencyPublicDisplayDto,
  withAgencyIdSchema,
} from "shared";
import { NotFoundError } from "../../../config/helpers/httpErrors";
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
    const [agencyDto] = await uow.agencyRepository.getByIds([agencyId]);
    if (!agencyDto) throw new NotFoundError(agencyId);
    const referedAgency =
      agencyDto.refersToAgencyId &&
      (await uow.agencyRepository.getById(agencyDto.refersToAgencyId));
    return toAgencyPublicDisplayDto(
      agencyDto,
      referedAgency ? referedAgency : null,
    );
  }
}
