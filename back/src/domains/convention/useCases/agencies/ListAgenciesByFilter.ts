import {
  AgencyDto,
  AgencyOption,
  ListAgenciesRequestDto,
  activeAgencyStatuses,
  listAgenciesRequestSchema,
} from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";

export class ListAgenciesByFilter extends TransactionalUseCase<
  ListAgenciesRequestDto,
  AgencyOption[]
> {
  protected inputSchema = listAgenciesRequestSchema;

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
  kind: agency.kind,
});
