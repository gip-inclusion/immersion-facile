import {
  AgencyKind,
  AgencyKindFilter,
  AgencyOption,
  AgencyWithUsersRights,
  ListAgencyOptionsRequestDto,
  activeAgencyStatuses,
  agencyKindList,
  listAgencyOptionsRequestSchema,
  miniStageAgencyKinds,
  removeSpaces,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { GetAgenciesFilters } from "../ports/AgencyRepository";

export class ListAgencyOptionsByFilter extends TransactionalUseCase<
  ListAgencyOptionsRequestDto,
  AgencyOption[]
> {
  protected inputSchema = listAgencyOptionsRequestSchema;

  public async _execute(
    {
      departmentCode,
      nameIncludes,
      filterKind,
      siret,
      status,
    }: ListAgencyOptionsRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyOption[]> {
    const extraFilters = getFiltersFromFilterKind(filterKind);
    const agencies = await uow.agencyRepository.getAgencies({
      filters: {
        nameIncludes,
        departmentCode,
        status: status ? status : activeAgencyStatuses,
        siret: siret ? removeSpaces(siret) : undefined,
        ...extraFilters,
      },
    });

    return agencies.map(toAgencyOption);
  }
}

const getFiltersFromFilterKind = (
  filterKind?: AgencyKindFilter,
): GetAgenciesFilters => {
  if (!filterKind) return {};

  const doesNotReferToOtherAgency =
    filterKind === "withoutRefersToAgency" ? true : undefined;

  return {
    kinds: getAgencyKindsFromFilterKind(filterKind),
    doesNotReferToOtherAgency,
  };
};

const getAgencyKindsFromFilterKind = (
  filterKind: AgencyKindFilter,
): AgencyKind[] | undefined => {
  if (filterKind === "withoutRefersToAgency") return undefined;
  if (filterKind === "immersionPeOnly") return ["pole-emploi"];
  if (filterKind === "miniStageOnly") return miniStageAgencyKinds;
  if (filterKind === "miniStageExcluded")
    return agencyKindList.filter(
      (agencyKind) => !miniStageAgencyKinds.includes(agencyKind),
    );

  const _exhaustiveCheck: never = filterKind;
};

export const toAgencyOption = (
  agency: AgencyWithUsersRights,
): AgencyOption => ({
  id: agency.id,
  name: toAgencyOptionName(agency),
  kind: agency.kind,
  status: agency.status,
});

const toAgencyOptionName = (agency: AgencyWithUsersRights): string =>
  `${agency.name} (${agency.address.city})`;
