import {
  activeAgencyStatuses,
  AgencyDto,
  AgencyOption,
  ListAgenciesRequestDto,
  listAgenciesByDepartmentCodeRequestSchema,
} from "shared";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";

export class ListAgenciesByFilter extends TransactionalUseCase<
  ListAgenciesRequestDto,
  AgencyOption[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = listAgenciesByDepartmentCodeRequestSchema;

  public async _execute(
    { departmentCode, nameIncludes, kind }: ListAgenciesRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyOption[]> {
    const agencies = await uow.agencyRepository.getAgencies({
      filters: {
        nameIncludes,
        departmentCode,
        kind,
        status: activeAgencyStatuses,
      },
    });

    return agencies.map(toAgencyOption);
  }
}

export const toAgencyOption = (agency: AgencyDto): AgencyOption => ({
  id: agency.id,
  name: agency.name,
});
