import {
  activeAgencyStatuses,
  AgencyDto,
  AgencyOption,
  ListAgenciesRequestDto,
  listAgenciesByDepartmentCodeRequestSchema,
} from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ListAgenciesByFilter extends TransactionalUseCase<
  ListAgenciesRequestDto,
  AgencyOption[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = listAgenciesByDepartmentCodeRequestSchema;

  public async _execute(
    { departmentCode, name, filter }: ListAgenciesRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyOption[]> {
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

const agencyToAgencyWithPositionDto = (config: AgencyDto): AgencyOption => ({
  id: config.id,
  name: config.name,
});
