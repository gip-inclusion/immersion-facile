import React from "react";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { weekdays } from "shared";

type WeekdayDropdownProps = {
  name: string;
  minDay: number;
  maxDay: number;
  selected: number;
  onValueChange: (pickedDay: number) => void;
  disabled?: boolean;
  id: string;
};
export const WeekdayDropdown = ({
  name,
  minDay,
  maxDay,
  selected,
  onValueChange,
  disabled,
  id,
}: WeekdayDropdownProps) => (
  <Select
    label=""
    options={weekdays
      .filter((_, index) => index >= minDay && index <= maxDay)
      .map((day, index) => ({
        label: day,
        value: (index + minDay) as unknown as string,
      }))}
    nativeSelectProps={{
      id,
      name,
      value: selected as unknown as string,
      onChange: (event) => onValueChange(Number(event.currentTarget.value)),
      disabled,
      "aria-label": "Choisissez un jour de la semaine",
    }}
  />
);
