import { fr } from "@codegouvfr/react-dsfr";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { Tooltip } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { prop, propEq } from "ramda";
import React from "react";
import { useDispatch } from "react-redux";
import {
  AgencyId,
  AgencyOption,
  activeAgencyStatuses,
  agencyStatusToLabel,
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
  };
};

type AgencyAdminAutocompleteProps = {
  title: string;
  initialValue?: AgencyOption | undefined;
  className?: string;
  placeholder: string;
  tooltip?: string;
};

const isOneOfTheOptionsLabel = (options: AgencyOption[], searchTerm: string) =>
  options.map(prop("name")).includes(searchTerm);

export const AgencyAdminAutocomplete = ({
  title,
  className,
  placeholder = "Ex : boulangère, infirmier",
  tooltip,
}: AgencyAdminAutocompleteProps): JSX.Element => {
  // TODO Mutualiser juste l'autocomplete avec les conventions ? Ou passer le selecteur en param du composant
  const {
    agencySearchQuery: agencySearchText,
    isSearching,
    agencyOptions,
    agency,
  } = useAppSelector(agencyAdminSelectors.agencyState);
  const { updateSearchTerm, selectOption } = useAgencyAdminAutocomplete();

  const { cx } = useStyles();

  const noOptionText =
    isSearching || !agencySearchText ? "..." : "Aucune agence trouvée";

  const getNameFromAgencyIdAsReactElement = (agencyId?: AgencyId) => {
    if (!agencyId) return;
    const agencyOption = agencyOptions.find(propEq(agencyId, "id"));
    if (!agencyOption) return;

    return (
      <>
        {agencyOption.name}&nbsp;
        {!activeAgencyStatuses.includes(agencyOption.status) && (
          <AgencyStatusBadge status={agencyOption.status} />
        )}
      </>
    );
  };

  const getNameFromAgencyIdAsString = (
    agencyId?: AgencyId,
  ): string | undefined => {
    if (!agencyId) return;
    const agencyOption = agencyOptions.find(propEq(agencyId, "id"));
    if (!agencyOption) return;

    const status = !activeAgencyStatuses.includes(agencyOption.status)
      ? agencyStatusToLabel[agencyOption.status]
      : "";
    return `${agencyOption.name}${status ? ` [${status}]` : ""}`;
  };

  return (
    <>
      <Autocomplete
        disablePortal
        filterOptions={(x) => x}
        options={agencyOptions.map(prop("id"))}
        id={domElementIds.admin.agencyTab.editAgencyAutocompleteInput}
        value={agency ? agency.id : ""}
        noOptionsText={
          agencySearchText
            ? noOptionText
            : "Saisissez le nom ou le siret d'une agence"
        }
        getOptionLabel={(option: AgencyId) => option}
        renderOption={(props, option) => (
          <li {...props}>{getNameFromAgencyIdAsReactElement(option)}</li>
        )}
        onChange={(_, selectedAgencyId: AgencyId | null) => {
          if (!selectedAgencyId) return;
          selectOption(selectedAgencyId);
        }}
        onInputChange={(_, newSearchTerm) => {
          if (!isOneOfTheOptionsLabel(agencyOptions, newSearchTerm)) {
            updateSearchTerm(newSearchTerm);
          }
        }}
        renderInput={(params) => (
          <div
            ref={params.InputProps.ref}
            className={cx("im-autocomplete-search")}
          >
            <label
              className={cx(fr.cx("fr-label"), className)}
              htmlFor={"search"}
            >
              {title}
              {tooltip && tooltip !== "" && (
                <Tooltip
                  title={tooltip}
                  className={fr.cx("fr-ml-1w")}
                  placement="top"
                >
                  <InfoRoundedIcon />
                </Tooltip>
              )}
            </label>
            <input
              {...params.inputProps}
              value={getNameFromAgencyIdAsString(
                params.inputProps.value?.toString(),
              )}
              className={fr.cx("fr-input")}
              placeholder={placeholder}
              type="text"
            />
          </div>
        )}
      />
    </>
  );
};
