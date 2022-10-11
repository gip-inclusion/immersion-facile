import {
  activeAgencyStatuses,
  AgencyDto,
  AgencyIdAndName,
  ListAgenciesRequestDto,
  listAgenciesByDepartmentCodeRequestSchema,
} from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ListAgenciesByFilter extends TransactionalUseCase<
  ListAgenciesRequestDto,
  AgencyIdAndName[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = listAgenciesByDepartmentCodeRequestSchema;

  public async _execute(
    { departmentCode, name, filter }: ListAgenciesRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyIdAndName[]> {
    const agencies = await uow.agencyRepository.getAgencies({
      filters: {
        name,
        departmentCode,
        kind: filter,
        status: activeAgencyStatuses,
      },
    });

    return agencies.map(agencyToAgencyWithPositionDto);
  }
}

const agencyToAgencyWithPositionDto = (config: AgencyDto): AgencyIdAndName => ({
  id: config.id,
  name: config.name,
});
