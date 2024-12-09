import { fr } from "@codegouvfr/react-dsfr";
import Autocomplete from "@mui/material/Autocomplete";
import React, { useEffect, useMemo, useState } from "react";
import {
  AppellationAndRomeDto,
  AppellationMatchDto,
  ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH,
} from "shared";
import { StringWithHighlights } from "src/app/components/forms/establishment/StringWithHighlights";
import { useDebounce } from "src/app/hooks/useDebounce";
import { outOfReduxDependencies } from "src/config/dependencies";
import { useStyles } from "tss-react/dsfr";

type AppellationAutocompleteProps = {
  label: React.ReactNode;
  initialValue?: AppellationAndRomeDto | undefined;
  onAppellationSelected: (p: AppellationAndRomeDto) => void;
  onInputClear?: () => void;
  className?: string;
  selectedAppellations?: AppellationAndRomeDto[];
  hintText?: React.ReactNode;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  useNaturalLanguage?: boolean;
  shouldClearInput?: boolean;
  onAfterClearInput?: () => void;
};

export const AppellationAutocomplete = ({
  initialValue,
  onAppellationSelected,
  onInputClear,
  label,
  className,
  selectedAppellations = [],
  hintText,
  placeholder,
  id = "im-appellation-autocomplete",
  disabled = false,
  useNaturalLanguage = false,
  shouldClearInput,
  onAfterClearInput,
}: AppellationAutocompleteProps) => {
  const initialOption: AppellationMatchDto | null = useMemo(
    () =>
      initialValue
        ? {
            appellation: initialValue,
            matchRanges: [],
          }
        : null,
    [initialValue],
  );

  const [selectedOption, setSelectedOption] =
    useState<AppellationMatchDto | null>(initialOption);
  const [searchTerm, setSearchTerm] = useState<string>(
    initialValue?.appellationLabel ?? "",
  );
  const { cx } = useStyles();
  const [options, setOptions] = useState<AppellationMatchDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inputHasChanged, setInputHasChanged] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm);
  useEffect(() => {
    if (initialOption && selectedOption === null) {
      setSelectedOption(initialOption);
    }
  }, [initialOption, selectedOption]);
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
        const appellationOptions =
          await outOfReduxDependencies.formCompletionGateway.getAppellationDtoMatching(
            sanitizedTerm,
            useNaturalLanguage,
          );
        setOptions(
          appellationOptions.filter(
            (appellationOption) =>
              !selectedAppellations
                .map((selected) => selected.appellationCode)
                .includes(appellationOption.appellation.appellationCode),
          ),
        );
      } catch (e: any) {
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log("AppellationAutocomplete", e);
      } finally {
        setIsSearching(false);
      }
    })();
  }, [debounceSearchTerm]);

  useEffect(() => {
    if (shouldClearInput && onAfterClearInput) {
      setSearchTerm("");
      onAfterClearInput();
    }
  }, [shouldClearInput, onAfterClearInput]);

  const noOptionText = ({
    isSearching,
    debounceSearchTerm,
    searchTerm,
  }: {
    isSearching: boolean;
    debounceSearchTerm: string;
    searchTerm: string;
  }) => {
    if (!searchTerm) return "Saisissez un métier";
    if (searchTerm.length < ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH)
      return "Saisissez au moins 3 caractères";
    if (isSearching || searchTerm !== debounceSearchTerm) return "...";
    return "Aucun métier trouvé";
  };
  return (
    <Autocomplete
      disablePortal
      disabled={disabled}
      filterOptions={(x) => x}
      options={options}
      value={selectedOption}
      defaultValue={initialOption}
      inputValue={
        inputHasChanged
          ? searchTerm
          : initialOption?.appellation.appellationLabel
      }
      noOptionsText={
        searchTerm
          ? noOptionText({
              isSearching,
              debounceSearchTerm,
              searchTerm,
            })
          : "Saisissez un métier"
      }
      getOptionLabel={(option) => option.appellation.appellationLabel ?? ""}
      id={id}
      renderOption={(props, option) => (
        <li {...props}>
          <StringWithHighlights
            description={option.appellation.appellationLabel}
            matchRanges={option.matchRanges}
          />
        </li>
      )}
      onChange={(_, appellationMatch: AppellationMatchDto | null) => {
        if (appellationMatch) {
          setSelectedOption(appellationMatch);
          setSearchTerm(appellationMatch.appellation.appellationLabel);
          onAppellationSelected(appellationMatch.appellation);
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
            {hintText && (
              <span className={fr.cx("fr-hint-text")}>{hintText}</span>
            )}
            <input
              {...params.inputProps}
              value={searchTerm}
              id={id}
              className={fr.cx("fr-input")}
              placeholder={placeholder}
            />
          </div>
        );
      }}
    />
  );
};
