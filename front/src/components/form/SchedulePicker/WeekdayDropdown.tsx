import React, { ChangeEvent } from "react";
import { weekdays } from "src/shared/ScheduleUtils";

type WeekdayDropdownProps = {
  name: string;
  minDay: number;
  maxDay: number;
  selected: number;
  onValueChange: (pickedDay: number) => void;
  disabled?: boolean;
};
export const WeekdayDropdown = ({
  name,
  minDay,
  maxDay,
  selected,
  onValueChange,
  disabled,
}: WeekdayDropdownProps) => {
  const onChangeHandler = (evt: ChangeEvent) => {
    const target = evt.currentTarget as HTMLSelectElement;
    onValueChange(Number(target.value));
  };

  return (
    <select
      className="fr-select"
      id={name}
      name={name}
      value={selected}
      onChange={onChangeHandler}
      disabled={disabled}
    >
      {weekdays
        .filter((_, index) => index >= minDay && index <= maxDay)
        .map((day, index) => (
          <option value={index + minDay} key={name + day}>
            {day}
          </option>
        ))}
    </select>
  );
};
