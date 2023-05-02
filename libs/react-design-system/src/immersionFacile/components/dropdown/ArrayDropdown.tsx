import React, { useState } from "react";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";

export interface ArrayDropdownProps<T extends string> {
  options: T[];
  onSelect: (option?: string) => void;
  defaultSelectedOption?: T;
  allowEmpty: boolean;
  label?: string;
}

export const ArrayDropdown = <T extends string>({
  options,
  onSelect,
  defaultSelectedOption,
  allowEmpty,
  label,
}: ArrayDropdownProps<T>) => {
  const displayOptions: string[] = allowEmpty ? ["", ...options] : options;

  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    defaultSelectedOption ?? "",
  );
  return (
    <div>
      <Select
        label={label}
        options={displayOptions.map((option) => ({
          label: option,
          value: option,
          selected: selectedOption === option,
        }))}
        nativeSelectProps={{
          id: "roles-dropdown",
          name: "select",
          onChange: (event) => {
            const index = (event.currentTarget as unknown as HTMLSelectElement)
              .selectedIndex;
            const option = displayOptions.at(index);
            setSelectedOption(option ?? "");
            return onSelect(option ? option : undefined);
          },
          style: { width: "200px" },
          onEmptied: () => setSelectedOption(""),
        }}
      />
    </div>
  );
};
