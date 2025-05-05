import { fr } from "@codegouvfr/react-dsfr";
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
import { useStyles } from "tss-react/dsfr";

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
    clearOption: () =>
      dispatch(agencyAdminSlice.actions.clearAgencyRequested()),
  };
};

export type AgencyAdminAutocompleteProps = RSAutocompleteComponentProps<
  "agency",
  AgencyOption,
  "agencyAdminAutocomplete"
> & {
  initialValue?: AgencyOption;
};

export const AgencyAdminAutocomplete = ({
  label,
  className,
  locator,
}: AgencyAdminAutocompleteProps): JSX.Element => {
  // TODO Mutualiser juste l'autocomplete avec les conventions ? Ou passer le selecteur en param du composant
  const {
    agencySearchQuery: agencySearchText,
    isSearching,
    agencyOptions,
    agency: selectedAgency,
  } = useAppSelector(agencyAdminSelectors.agencyState);
  const { updateSearchTerm, selectOption, clearOption } =
    useAgencyAdminAutocomplete();
  const [inputValue, setInputValue] = useState(agencySearchText);
  const noOptionText =
    isSearching || !agencySearchText ? "..." : "Aucune agence trouvée";

  const sortedAgencyOptions: AgencyOption[] = [...agencyOptions].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const { cx } = useStyles();

  return (
    <RSAutocomplete
      locator={locator}
      label={label}
      selectProps={{
        options: sortedAgencyOptions.map((option) => ({
          label: option.name,
          value: option,
        })),
        inputId: domElementIds.admin.agencyTab.editAgencyAutocompleteInput,
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
            clearOption();
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
          Option: ({ innerRef, innerProps, data }) => (
            <div
              ref={innerRef}
              {...innerProps}
              className={cx(
                innerProps.className,
                fr.cx("fr-nav__link"),
                "im-select__option",
              )}
            >
              {data.label}
              {!activeAgencyStatuses.includes(data.value.status) && (
                <AgencyStatusBadge status={data.value.status} />
              )}
            </div>
          ),
        },
      }}
      className={className}
    />
  );
};
