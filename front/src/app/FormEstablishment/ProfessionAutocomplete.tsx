import Autocomplete from "@mui/material/Autocomplete";
import React, { useEffect, useState } from "react";
import { formEstablishmentGateway } from "src/app/dependencies";
import { StringWithHighlights } from "src/app/FormEstablishment/StringWithHighlights";
import { Proposal } from "src/app/FormEstablishment/useDropdown";
import { useDebounce } from "src/app/useDebounce";
import { ProfessionDto, RomeSearchMatchDto } from "src/shared/rome";

const romeSearchMatchToProposal = ({
  matchRanges,
  profession,
}: RomeSearchMatchDto): Option => ({
  value: profession,
  description: profession.description,
  matchRanges,
});

type ProfessionAutocompleteProps = {
  title: string;
  initialValue?: ProfessionDto | undefined;
  setFormValue: (p: ProfessionDto) => void;
  className?: string;
};

type Option = Proposal<ProfessionDto>;

export const ProfessionAutocomplete = ({
  initialValue,
  setFormValue,
  title,
  className,
}: ProfessionAutocompleteProps) => {
  const initialOption: Option | null = initialValue
    ? {
        value: initialValue,
        description: initialValue?.description,
        matchRanges: [],
      }
    : null;

  const [selectedOption, setSelectedOption] = useState<Option | null>(
    initialOption,
  );
  const [searchTerm, setSearchTerm] = useState<string>(
    initialValue?.description ?? "",
  );
  const [options, setOptions] = useState<Option[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm, 400);

  useEffect(() => {
    (async () => {
      const sanitizedTerm = debounceSearchTerm.trim();
      if (!sanitizedTerm) return [];
      try {
        setIsSearching(true);
        const romeOptions = await formEstablishmentGateway.searchProfession(
          sanitizedTerm,
        );
        setOptions(romeOptions.map(romeSearchMatchToProposal));
      } catch (e: any) {
        console.error(e);
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
        options={options}
        value={selectedOption}
        noOptionsText={searchTerm ? noOptionText : "Saisissez un métier"}
        getOptionLabel={(option: Option) => option.value.description}
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
            selectedOption ? selectedOption.value : { description: "" },
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
            <input {...params.inputProps} className={"fr-input"} />
          </div>
        )}
      />
    </>
  );
};
