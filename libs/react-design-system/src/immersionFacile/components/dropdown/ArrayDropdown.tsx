import React, { useState } from "react";
import { Select } from "@codegouvfr/react-dsfr/Select";

export interface ArrayDropdownProps<T extends string> {
  options: T[];
  onSelect: (option?: T) => void;
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
  const displayOptions: (T | "")[] = allowEmpty ? ["", ...options] : options;

  const [selectedOption, setSelectedOption] = useState<T | "">(
    defaultSelectedOption ?? "",
  );
  const onChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    const index = event.currentTarget.selectedIndex;
    const option = displayOptions.at(index);
    setSelectedOption(option ?? "");
    return onSelect(option ? option : undefined);
  };
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
          onChange,
          style: { width: "200px" },
          onEmptied: () => setSelectedOption(""),
        }}
      />
    </div>
  );
};
