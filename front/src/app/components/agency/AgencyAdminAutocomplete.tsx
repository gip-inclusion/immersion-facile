import { useState } from "react";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";

import { useDispatch } from "react-redux";
import {
  type AgencyId,
  type AgencyOption,
  activeAgencyStatuses,
  domElementIds,
} from "shared";
import { AgencyStatusBadge } from "src/app/components/agency/AgencyStatusBadge";
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
    agency: selectedAgency,
  } = useAppSelector(agencyAdminSelectors.agencyState);
  const { updateSearchTerm, selectOption } = useAgencyAdminAutocomplete();
  const [inputValue, setInputValue] = useState(agencySearchText);
  const noOptionText =
    isSearching || !agencySearchText ? "..." : "Aucune agence trouvée";

  const sortedAgencyOptions: AgencyOption[] = [...agencyOptions].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <RSAutocomplete
      label={label}
      selectProps={{
        options: sortedAgencyOptions.map((option) => ({
          label: option.name,
          value: option,
        })),
        id: domElementIds.admin.agencyTab.editAgencyAutocompleteInput,
        value: selectedAgency?.id
          ? {
              label: selectedAgency.name,
              value: selectedAgency,
            }
          : undefined,
        noOptionsMessage: () => noOptionText,
        isLoading: isSearching,
        inputValue,
        loadingMessage: () => "Recherche d'agence en cours...",
        placeholder: "Rechercher une agence",
        onChange: (searchResult, actionMeta) => {
          if (
            actionMeta.action === "clear" ||
            actionMeta.action === "remove-value"
          ) {
            return;
          }
          if (searchResult) {
            updateSearchTerm(searchResult.label);
            selectOption(searchResult.value.id);
          }
        },
        onInputChange: (searchTerm) => {
          setInputValue(searchTerm);
          updateSearchTerm(searchTerm);
        },
        components: {
          Option: (optionComponentProps) => (
            <>
              {optionComponentProps.data.label}
              {!activeAgencyStatuses.includes(
                optionComponentProps.data.value.status,
              ) && (
                <AgencyStatusBadge
                  status={optionComponentProps.data.value.status}
                />
              )}
            </>
          ),
        },
      }}
      className={className}
    />
  );
};
