import React, { useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Autocomplete from "@mui/material/Autocomplete";
import { useStyles } from "tss-react/dsfr";
import {
  AppellationAndRomeDto,
  AppellationMatchDto,
  ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH,
} from "shared";
import { Proposal } from "src/app/components/forms/establishment/Proposal";
import { StringWithHighlights } from "src/app/components/forms/establishment/StringWithHighlights";
import { useDebounce } from "src/app/hooks/useDebounce";
import { romeAutocompleteGateway } from "src/config/dependencies";

const romeSearchMatchToProposal = ({
  matchRanges,
  appellation,
}: AppellationMatchDto): Option => ({
  value: appellation,
  description: appellation.appellationLabel,
  matchRanges,
});

type AppellationAutocompleteProps = {
  label: string;
  initialValue?: AppellationAndRomeDto | undefined;
  onAppellationSelected: (p: AppellationAndRomeDto) => void;
  onInputClear?: () => void;
  className?: string;
  selectedAppellations?: AppellationAndRomeDto[];
  description?: string;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
};

type Option = Proposal<AppellationAndRomeDto>;

export const AppellationAutocomplete = ({
  initialValue,
  onAppellationSelected,
  onInputClear,
  label,
  className,
  selectedAppellations = [],
  description,
  placeholder,
  id = "im-appellation-autocomplete",
  disabled = false,
}: AppellationAutocompleteProps) => {
  const initialOption: Option | null = initialValue
    ? {
        value: initialValue,
        description: initialValue?.appellationLabel ?? "",
        matchRanges: [],
      }
    : null;

  const [selectedOption, setSelectedOption] = useState<Option | null>(
    initialOption,
  );
  const [searchTerm, setSearchTerm] = useState<string>(
    initialValue?.appellationLabel ?? "",
  );
  const { cx } = useStyles();
  const [options, setOptions] = useState<Option[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inputHasChanged, setInputHasChanged] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm);
  useEffect(() => {
    if (initialOption && selectedOption === null) {
      setSelectedOption(initialOption);
    }
  }, [initialOption]);
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const sanitizedTerm = debounceSearchTerm.trim();
      if (
        !sanitizedTerm ||
        sanitizedTerm.length < ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH
      ) {
        setOptions([]);
        return [];
      }
      try {
        setIsSearching(true);
        const romeOptions =
          await romeAutocompleteGateway.getAppellationDtoMatching(
            sanitizedTerm,
          );
        setOptions(
          romeOptions
            .filter(
              (romeOption) =>
                !selectedAppellations
                  .map((selected) => selected.appellationCode)
                  .includes(romeOption.appellation.appellationCode),
            )
            .map(romeSearchMatchToProposal),
        );
      } catch (e: any) {
        //eslint-disable-next-line no-console
        console.log("AppellationAutocomplete", e);
      } finally {
        setIsSearching(false);
      }
    })();
  }, [debounceSearchTerm]);

  const noOptionText =
    isSearching || !debounceSearchTerm ? "..." : "Aucun métier trouvé";
  return (
    <>
      <Autocomplete
        disablePortal
        disabled={disabled}
        filterOptions={(x) => x}
        options={options}
        value={selectedOption}
        defaultValue={initialOption}
        inputValue={inputHasChanged ? searchTerm : initialOption?.description}
        noOptionsText={searchTerm ? noOptionText : "Saisissez un métier"}
        getOptionLabel={(option: Option | undefined) =>
          option
            ? option.value.appellationLabel
            : "missing option.value.appellationLabel"
        }
        id={id}
        renderOption={(props, option) => (
          <li {...props}>
            <StringWithHighlights
              description={option.description}
              matchRanges={option.matchRanges}
            />
          </li>
        )}
        onChange={(_, selectedOption: Option | null) => {
          if (selectedOption) {
            setSelectedOption(selectedOption);
            setSearchTerm(selectedOption.description);
            onAppellationSelected(selectedOption.value);
          }
        }}
        onInputChange={(_, newSearchTerm, reason) => {
          if (searchTerm !== newSearchTerm && reason === "input") {
            if (newSearchTerm === "") {
              onInputClear?.();
            }
            setSearchTerm(newSearchTerm);
            setInputHasChanged(true);
          }
        }}
        renderInput={(params) => {
          const { id } = params;

          return (
            <div ref={params.InputProps.ref}>
              <label className={cx(fr.cx("fr-label"), className)} htmlFor={id}>
                {label}
              </label>
              {description && (
                <span className={fr.cx("fr-hint-text")}>{description}</span>
              )}
              <input
                {...params.inputProps}
                id={id}
                className={fr.cx("fr-input")}
                placeholder={placeholder ?? "Ex: boulanger, styliste, etc."}
              />
            </div>
          );
        }}
      />
    </>
  );
};
