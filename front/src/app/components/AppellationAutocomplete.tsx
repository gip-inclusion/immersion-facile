import Autocomplete from "@mui/material/Autocomplete";
import React, { useEffect, useState } from "react";
import { romeAutocompleteGateway } from "src/app/config/dependencies";
import { useDebounce } from "src/app/utils/useDebounce";
import { AppellationDto, AppellationMatchDto } from "shared";
import { Proposal } from "../pages/Establishment/components/Proposal";
import { StringWithHighlights } from "../pages/Establishment/components/StringWithHighlights";

const romeSearchMatchToProposal = ({
  matchRanges,
  appellation,
}: AppellationMatchDto): Option => ({
  value: appellation,
  description: appellation.appellationLabel,
  matchRanges,
});

type AppellationAutocompleteProps = {
  title: string;
  initialValue?: AppellationDto | undefined;
  setFormValue: (p: AppellationDto) => void;
  className?: string;
  selectedAppellations?: AppellationDto[];
};

type Option = Proposal<AppellationDto>;

export const AppellationAutocomplete = ({
  initialValue,
  setFormValue,
  title,
  className,
  selectedAppellations = [],
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
  const [options, setOptions] = useState<Option[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm, 300);

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
        renderInput={(params) => (
          <div ref={params.InputProps.ref}>
            <label className={`fr-label ${className ?? ""}`} htmlFor={"search"}>
              {title}
            </label>
            <input
              {...params.inputProps}
              className={"fr-input"}
              placeholder="Prêt à porter"
            />
          </div>
        )}
      />
    </>
  );
};
