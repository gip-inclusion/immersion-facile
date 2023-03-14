import React, { ChangeEvent } from "react";
import { weekdays } from "shared";
import { Select } from "@codegouvfr/react-dsfr/Select";

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
}: WeekdayDropdownProps) => {
  const onChangeHandler = (evt: ChangeEvent) => {
    const target = evt.currentTarget as HTMLSelectElement;
    onValueChange(Number(target.value));
  };

  return (
    <Select
      label=""
      options={weekdays
        .filter((_, index) => index >= minDay && index <= maxDay)
        .map((day, index) => ({
          label: day,
          value: index + minDay,
        }))}
      nativeSelectProps={{
        id,
        name,
        value: selected,
        onChange: onChangeHandler,
        disabled,
        "aria-label": "Choisissez un jour de la semaine",
      }}
    />
  );
};
