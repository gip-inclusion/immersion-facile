import { DepartmentCode } from "shared/src/address/address.dto";
import {
  activeAgencyStatuses,
  AgencyDto,
  AgencyKindFilter,
  AgencyIdAndName,
  ListAgenciesWithDepartmentCodeRequestDto,
} from "shared/src/agency/agency.dto";
import { listAgenciesWithDepartmentCodeRequestSchema } from "shared/src/agency/agency.schema";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ListAgenciesWithDepartmentCode extends TransactionalUseCase<
  ListAgenciesWithDepartmentCodeRequestDto,
  AgencyIdAndName[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = listAgenciesWithDepartmentCodeRequestSchema;

  public async _execute(
    { departmentCode, filter }: ListAgenciesWithDepartmentCodeRequestDto,
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
