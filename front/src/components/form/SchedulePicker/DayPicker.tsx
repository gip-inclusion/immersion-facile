import React from "react";
import { ComplexScheduleDto, ScheduleDto } from "src/shared/ScheduleSchema";

type DayPickerProps = {
  complexSchedule: ComplexScheduleDto;
  selectedIndex: number;
  onChange: (index: number) => void;
  disabled?: boolean;
};

export const DayPicker = ({
  complexSchedule,
  selectedIndex,
  onChange,
  disabled,
}: DayPickerProps) => {
  const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <>
      <div className="day-picker">
        {weekDays.map((name, index) => {
          let className = "numberCircle";
          if (complexSchedule[index].length > 0) {
            className += " filled";
          }

          if (index === selectedIndex) {
            className = "numberCircle selected";
          }

          return (
            <button
              type="button"
              className={className}
              onClick={() => onChange(index)}
              key={"weekdaybtn" + index}
              disabled={disabled}
            >
              <div>{name}</div>
            </button>
          );
        })}
      </div>
    </>
  );
};
