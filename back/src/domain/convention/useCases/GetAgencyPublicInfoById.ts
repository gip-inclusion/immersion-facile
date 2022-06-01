import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { toAgencyPublicDisplayDto } from "shared/src/agency/agency";
import {
  AgencyPublicDisplayDto,
  WithAgencyId,
} from "shared/src/agency/agency.dto";
import { withAgencyIdSchema } from "shared/src/agency/agency.schema";
import { UseCase } from "../../core/UseCase";
import { AgencyRepository } from "../ports/AgencyRepository";

export class GetAgencyPublicInfoById extends UseCase<
  WithAgencyId,
  AgencyPublicDisplayDto
> {
  constructor(readonly agencyRepository: AgencyRepository) {
    super();
  }

  inputSchema = withAgencyIdSchema;

  public async _execute({ id }: WithAgencyId): Promise<AgencyPublicDisplayDto> {
    const agencyEntity = await this.agencyRepository.getById(id);
    if (!agencyEntity) throw new NotFoundError(id);
    return toAgencyPublicDisplayDto(agencyEntity);
  }
}
