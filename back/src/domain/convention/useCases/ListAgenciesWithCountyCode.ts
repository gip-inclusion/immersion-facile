import { CountyCode } from "shared/src/address/address.dto";
import {
  activeAgencyStatuses,
  AgencyDto,
  AgencyKindFilter,
  AgencyIdAndName,
  ListAgenciesWithPositionRequestDto,
} from "shared/src/agency/agency.dto";
import { listAgenciesRequestSchema } from "shared/src/agency/agency.schema";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ListAgenciesWithCountyCode extends TransactionalUseCase<
  ListAgenciesWithPositionRequestDto,
  AgencyIdAndName[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = listAgenciesRequestSchema;

  public async _execute(
    { countyCode, filter }: ListAgenciesWithPositionRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyIdAndName[]> {
    const agencies = await getActiveAgencies(uow, countyCode, filter);
    return agencies.map(agencyToAgencyWithPositionDto);
  }
}

const getActiveAgencies = (
  uow: UnitOfWork,
  countyCode: CountyCode,
  agencyKindFilter?: AgencyKindFilter,
): Promise<AgencyDto[]> =>
  uow.agencyRepository.getAgencies({
    filters: {
      countyCode,
      kind: agencyKindFilter,
      status: activeAgencyStatuses,
    },
    limit: 20,
  });

const agencyToAgencyWithPositionDto = (config: AgencyDto): AgencyIdAndName => ({
  id: config.id,
  name: config.name,
});
