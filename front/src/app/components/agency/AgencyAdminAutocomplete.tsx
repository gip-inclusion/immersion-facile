import { prop, propEq } from "ramda";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";

import { useDispatch } from "react-redux";
import {
  type AgencyId,
  type AgencyOption,
  activeAgencyStatuses,
  agencyStatusToLabel,
  domElementIds,
} from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import { agencyAdminSlice } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { icUsersAdminSlice } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";

export const useAgencyAdminAutocomplete = () => {
  const dispatch = useDispatch();

  return {
    updateSearchTerm: (searchTerm: string) =>
      dispatch(agencyAdminSlice.actions.setAgencySearchQuery(searchTerm)),
    selectOption: (agencyId: AgencyId) => {
      dispatch(agencyAdminSlice.actions.setSelectedAgencyId(agencyId));
      dispatch(
        icUsersAdminSlice.actions.fetchAgencyUsersRequested({
          agencyId,
        }),
      );
    },
  };
};

export type AgencyAdminAutocompleteProps = RSAutocompleteComponentProps<
  "agency",
  AgencyOption
> & {
  useNaturalLanguage?: boolean;
  initialValue?: AgencyOption;
};

export const AgencyAdminAutocomplete = ({
  label,
  className,
}: AgencyAdminAutocompleteProps): JSX.Element => {
  // TODO Mutualiser juste l'autocomplete avec les conventions ? Ou passer le selecteur en param du composant
  const {
    agencySearchQuery: agencySearchText,
    isSearching,
    agencyOptions,
    agency,
  } = useAppSelector(agencyAdminSelectors.agencyState);
  const { updateSearchTerm, selectOption } = useAgencyAdminAutocomplete();

  const noOptionText =
    isSearching || !agencySearchText ? "..." : "Aucune agence trouvée";

  const getNameFromAgencyIdAsString = (
    agencyId: AgencyId,
  ): string | undefined => {
    if (!agencyId) return;
    const agencyOption = agencyOptions.find(propEq(agencyId, "id"));
    if (!agencyOption) return;

    const status = !activeAgencyStatuses.includes(agencyOption.status)
      ? agencyStatusToLabel[agencyOption.status]
      : "";
    return `${agencyOption.name}${status ? ` [${status}]` : ""}`;
  };

  const sortedAgencyOptions: AgencyId[] = [...agencyOptions]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(prop("id"));

  return (
    <RSAutocomplete
      label={label}
      selectProps={{
        options: sortedAgencyOptions.map((option) => ({
          label: getNameFromAgencyIdAsString(option) ?? "",
          value: option,
        })),
        id: domElementIds.admin.agencyTab.editAgencyAutocompleteInput,
        value: agency?.id
          ? {
              label: getNameFromAgencyIdAsString(agency.id) ?? "",
              value: agency.id,
            }
          : undefined,
        noOptionsMessage: () => noOptionText,
        isLoading: isSearching,
        loadingMessage: () => "Recherche d'agence en cours...",
        onChange: (searchResult, actionMeta) => {
          if (
            actionMeta.action === "clear" ||
            actionMeta.action === "remove-value"
          ) {
            return;
          }
          if (searchResult) {
            updateSearchTerm(searchResult.label);
            selectOption(searchResult.value);
          }
        },
        onInputChange: (searchTerm) => updateSearchTerm(searchTerm),
      }}
      className={className}
    />
  );
};
