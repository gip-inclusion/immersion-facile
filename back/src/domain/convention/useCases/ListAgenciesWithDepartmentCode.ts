import { DepartmentCode } from "shared/src/address/address.dto";
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

export class ListAgenciesWithDepartmentCode extends TransactionalUseCase<
  ListAgenciesWithPositionRequestDto,
  AgencyIdAndName[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = listAgenciesRequestSchema;

  public async _execute(
    { departmentCode, filter }: ListAgenciesWithPositionRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyIdAndName[]> {
    const agencies = await getActiveAgencies(uow, departmentCode, filter);
    return agencies.map(agencyToAgencyWithPositionDto);
  }
}

const getActiveAgencies = (
  uow: UnitOfWork,
  departmentCode: DepartmentCode,
  agencyKindFilter?: AgencyKindFilter,
): Promise<AgencyDto[]> =>
  uow.agencyRepository.getAgencies({
    filters: {
      departmentCode,
      kind: agencyKindFilter,
      status: activeAgencyStatuses,
    },
    limit: 20,
  });

const agencyToAgencyWithPositionDto = (config: AgencyDto): AgencyIdAndName => ({
  id: config.id,
  name: config.name,
});
