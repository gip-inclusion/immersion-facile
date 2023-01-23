import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { Tooltip } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { prop } from "ramda";
import React from "react";
import { RomeDto } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { romeAutocompleteSelector } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.selectors";
import { useRomeAutocompleteUseCase } from "src/app/hooks/romeAutocomplete.hook";
import { useStyles } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";

type RomeAutocompleteProps = {
  title: string;
  value?: RomeDto | undefined;
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
  value,
  id = "im-rome-autocomplete",
}: RomeAutocompleteProps): JSX.Element => {
  const { romeSearchText, isSearching, romeOptions } = useAppSelector(
    romeAutocompleteSelector,
  );
  const { updateSearchTerm, selectOption } = useRomeAutocompleteUseCase();

  const { cx } = useStyles();

  const noOptionText =
    isSearching || !romeSearchText ? "..." : "Aucun métier trouvé";

  return (
    <>
      <Autocomplete
        disablePortal
        filterOptions={(x) => x}
        options={romeOptions}
        id={id}
        value={value}
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
          <div
            ref={params.InputProps.ref}
            className={cx("im-autocomplete-search")}
          >
            <label
              className={cx(fr.cx("fr-label"), className)}
              htmlFor={params.inputProps.id}
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
