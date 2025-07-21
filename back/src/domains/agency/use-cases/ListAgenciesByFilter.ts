import {
  type AgencyKind,
  type AgencyKindFilter,
  type AgencyOption,
  type AgencyWithUsersRights,
  activeAgencyStatuses,
  agencyKindList,
  listAgencyOptionsRequestSchema,
  miniStageAgencyKinds,
  removeSpaces,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { GetAgenciesFilters } from "../ports/AgencyRepository";

export type ListAgencyOptionsByFilter = ReturnType<
  typeof makeListAgencyOptionsByFilter
>;
export const makeListAgencyOptionsByFilter = useCaseBuilder(
  "ListAgencyOptionsByFilter",
)
  .withInput(listAgencyOptionsRequestSchema)
  .build(async ({ uow, inputParams }) => {
    const { departmentCode, nameIncludes, filterKind, siret, status } =
      inputParams;

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
  });

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
  filterKind satisfies never;
};

export const toAgencyOption = (
  agency: AgencyWithUsersRights,
): AgencyOption => ({
  id: agency.id,
  name: agency.name,
  kind: agency.kind,
  status: agency.status,
  address: agency.address,
  refersToAgencyName: agency.refersToAgencyName,
});
