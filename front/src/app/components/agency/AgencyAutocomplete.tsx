import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { Tooltip } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { prop } from "ramda";
import React from "react";
import { AgencyIdAndName } from "shared";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { agencyAdminSelector } from "src/core-logic/domain/agenciesAdmin/agencyAdminSelector";
import { useAgencyAdminAutocompleteEpic } from "src/hooks/agenciesAdmin.hook";

type AgencyAutocompleteProps = {
  title: string;
  initialValue?: AgencyIdAndName | undefined;
  className?: string;
  placeholder: string;
  tooltip?: string;
};

const isOneOfTheOptionsLabel = (
  options: AgencyIdAndName[],
  searchTerm: string,
) => options.map(prop("name")).includes(searchTerm);

export const AgencyAutocomplete = ({
  title,
  className,
  placeholder = "Ex : boulangère, infirmier",
  tooltip,
}: AgencyAutocompleteProps): JSX.Element => {
  // TODO Mutualiser juste l'autocomplete avec les conventions ? Ou passer le selecteur en param du composant
  const { agencySearchText, isSearching, selectedAgency, agencyOptions } =
    useAppSelector(agencyAdminSelector);
  const { updateSearchTerm, selectOption } = useAgencyAdminAutocompleteEpic();

  const noOptionText =
    isSearching || !agencySearchText ? "..." : "Aucune agence trouvée";

  return (
    <>
      <Autocomplete
        disablePortal
        filterOptions={(x) => x}
        options={agencyOptions}
        value={selectedAgency}
        noOptionsText={agencySearchText ? noOptionText : "Saisissez un métier"}
        getOptionLabel={(option: AgencyIdAndName) => option.name}
        renderOption={(props, option) => <li {...props}>{option.name}</li>}
        onChange={(_, selectedAgency: AgencyIdAndName | null) => {
          if (!selectedAgency) return;
          selectOption(selectedAgency);
        }}
        onInputChange={(_, newSearchTerm) => {
          if (!isOneOfTheOptionsLabel(agencyOptions, newSearchTerm)) {
            updateSearchTerm(newSearchTerm);
          }
        }}
        renderInput={(params) => (
          <div ref={params.InputProps.ref} className="if-autocomplete-search">
            <label className={`fr-label ${className ?? ""}`} htmlFor={"search"}>
              {title}
              {tooltip && tooltip !== "" && (
                <Tooltip title={tooltip} className={"fr-ml-1w"} placement="top">
                  <InfoRoundedIcon />
                </Tooltip>
              )}
            </label>
            <input
              {...params.inputProps}
              className={"fr-input"}
              placeholder={placeholder}
              style={{ backgroundColor: "#fff" }}
              type="text"
            />
          </div>
        )}
      />
    </>
  );
};
