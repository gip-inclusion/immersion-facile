import Autocomplete from "@mui/material/Autocomplete";
import React, { useEffect, useState } from "react";
import {
  AppellationDto,
  AppellationMatchDto,
  cleanStringToHTMLAttribute,
} from "shared";
import { romeAutocompleteGateway } from "src/config/dependencies";
import { useDebounce } from "src/app/hooks/useDebounce";
import { Proposal } from "src/app/components/forms/establishment/Proposal";
import { StringWithHighlights } from "src/app/components/forms/establishment/StringWithHighlights";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

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
  initialValue?: AppellationDto | undefined;
  setFormValue: (p: AppellationDto) => void;
  className?: string;
  selectedAppellations?: AppellationDto[];
  description?: string;
};

type Option = Proposal<AppellationDto>;

export const AppellationAutocomplete = ({
  initialValue,
  setFormValue,
  label,
  className,
  selectedAppellations = [],
  description,
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
  const debounceSearchTerm = useDebounce(searchTerm, 300);
  useEffect(() => {
    if (initialOption && selectedOption === null) {
      setSelectedOption(initialOption);
    }
  }, [initialOption]);
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const sanitizedTerm = debounceSearchTerm.trim();
      if (!sanitizedTerm) return [];
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
        filterOptions={(x) => x}
        options={options}
        value={selectedOption}
        noOptionsText={searchTerm ? noOptionText : "Saisissez un métier"}
        getOptionLabel={(option: Option) => option.value.appellationLabel}
        renderOption={(props, option) => (
          <li {...props}>
            <StringWithHighlights
              description={option.description}
              matchRanges={option.matchRanges}
            />
          </li>
        )}
        onChange={(_, selectedOption: Option | null) => {
          setSelectedOption(selectedOption ?? null);
          setFormValue(
            selectedOption
              ? selectedOption.value
              : {
                  appellationCode: "",
                  appellationLabel: "",
                  romeCode: "",
                  romeLabel: "",
                },
          );
        }}
        onInputChange={(_, newSearchTerm) => {
          setSearchTerm(newSearchTerm);
        }}
        renderInput={(params) => {
          const { id } = params;
          const inputId = cleanStringToHTMLAttribute(
            "appellation-autocomplete",
            null,
            id,
          );

          return (
            <div ref={params.InputProps.ref}>
              <label
                className={cx(fr.cx("fr-label"), className)}
                htmlFor={inputId}
              >
                {label}
              </label>
              {description && (
                <span className={fr.cx("fr-hint-text")}>{description}</span>
              )}
              <input
                {...params.inputProps}
                id={inputId}
                className={fr.cx("fr-input")}
                placeholder="Prêt à porter"
              />
            </div>
          );
        }}
      />
    </>
  );
};
