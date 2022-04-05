import Autocomplete from "@mui/material/Autocomplete";
import React, { useEffect, useState } from "react";
import { romeAutocompleteGateway } from "src/app/config/dependencies";
import { Proposal } from "src/app/pages/Establishment/StringWithHighlights";
import { useDebounce } from "src/app/utils/useDebounce";
import { RomeDto } from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";

type RomeAutocompleteProps = {
  title: string;
  initialValue?: RomeDto | undefined;
  setFormValue: (p: RomeDto) => void;
  className?: string;
};

type Option = Proposal<RomeDto>;

export const RomeAutocomplete = ({
  initialValue,
  setFormValue,
  title,
  className,
}: RomeAutocompleteProps) => {
  const [selectedRomeDto, setSelectedRomeDto] = useState<RomeDto | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(
    initialValue?.romeLabel ?? "",
  );
  const [romeDtoOptions, setRomeDtoOptions] = useState<RomeDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    (async () => {
      const sanitizedTerm = debounceSearchTerm.trim();
      if (!sanitizedTerm) return [];
      try {
        setIsSearching(true);
        const romeOptions = await romeAutocompleteGateway.getRomeDtoMatching(
          sanitizedTerm,
        );
        setRomeDtoOptions(romeOptions);
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
        filterOptions={(x) => x}
        options={romeDtoOptions}
        value={selectedRomeDto}
        noOptionsText={searchTerm ? noOptionText : "Saisissez un métier"}
        getOptionLabel={(option: RomeDto) => option.romeLabel}
        renderOption={(props, option) => <li {...props}>{option.romeLabel}</li>}
        onChange={(_, selectedRomeDto: RomeDto | null) => {
          setSelectedRomeDto(selectedRomeDto ?? null);
          setFormValue(
            selectedRomeDto ?? {
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
