import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { Tooltip } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { prop } from "ramda";
import React from "react";
import { RomeDto } from "shared";
import { useAppSelector } from "src/hooks/reduxHooks";
import { romeAutocompleteSelector } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.selectors";
import { useRomeAutocompleteUseCase } from "src/hooks/romeAutocomplete.hook";

type RomeAutocompleteProps = {
  title: string;
  initialValue?: RomeDto | undefined;
  setFormValue: (p: RomeDto) => void;
  className?: string;
  placeholder: string;
  tooltip?: string;
  id?: string;
};

const isOneOfTheOptionsLabel = (options: RomeDto[], searchTerm: string) =>
  options.map(prop("romeLabel")).includes(searchTerm);

export const RomeAutocomplete = ({
  setFormValue,
  title,
  className,
  placeholder = "Ex : boulangère, infirmier",
  tooltip,
  initialValue,
  id = "im-rome-autocomplete",
}: RomeAutocompleteProps): JSX.Element => {
  const { romeSearchText, isSearching, selectedRomeDto, romeOptions } =
    useAppSelector(romeAutocompleteSelector);
  const { updateSearchTerm, selectOption } = useRomeAutocompleteUseCase();

  const noOptionText =
    isSearching || !romeSearchText ? "..." : "Aucun métier trouvé";

  return (
    <>
      <Autocomplete
        disablePortal
        filterOptions={(x) => x}
        options={romeOptions}
        id={id}
        value={selectedRomeDto ?? initialValue}
        noOptionsText={romeSearchText ? noOptionText : "Saisissez un métier"}
        getOptionLabel={(option: RomeDto) => option.romeLabel}
        renderOption={(props, option) => <li {...props}>{option.romeLabel}</li>}
        onChange={(_, selectedRomeDto: RomeDto | null) => {
          selectOption(selectedRomeDto);
          setFormValue(
            selectedRomeDto ?? {
              romeCode: "",
              romeLabel: "",
            },
          );
        }}
        onInputChange={(_, newSearchTerm) => {
          if (!isOneOfTheOptionsLabel(romeOptions, newSearchTerm)) {
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
