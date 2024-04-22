import {
  AgencyDto,
  AgencyOption,
  ListAgencyOptionsRequestDto,
  activeAgencyStatuses,
  listAgencyOptionsRequestSchema,
  removeSpaces,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export class ListAgencyOptionsByFilter extends TransactionalUseCase<
  ListAgencyOptionsRequestDto,
  AgencyOption[]
> {
  protected inputSchema = listAgencyOptionsRequestSchema;

  public async _execute(
    { departmentCode, nameIncludes, kind, siret }: ListAgencyOptionsRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyOption[]> {
    const agencies = await uow.agencyRepository.getAgencies({
      filters: {
        nameIncludes,
        departmentCode,
        kind,
        status: activeAgencyStatuses,
        siret: siret ? removeSpaces(siret) : undefined,
      },
    });

    return agencies.map(toAgencyOption);
  }
}

export const toAgencyOption = (agency: AgencyDto): AgencyOption => ({
  id: agency.id,
  name: toAgencyOptionName(agency),
  kind: agency.kind,
});

export const toAgencyOptionName = (agency: AgencyDto): string =>
  `${agency.name} (${agency.address.city})`;
