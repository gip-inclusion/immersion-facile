import React from "react";
import { ComplexScheduleDto } from "shared/src/schedule/ScheduleSchema";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

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
        {weekDays.map((name, index) => (
          <DayCircle
            key={index}
            name={name}
            dayStatus={getDayStatus(complexSchedule, index, selectedIndex)}
            disabled={disabled}
            onClick={() => onChange(index)}
          />
        ))}
      </div>
    </>
  );
};

type DayStatus = "empty" | "hasTime" | "isSelected";

const getDayStatus = (
  schedule: ComplexScheduleDto,
  index: number,
  selectedIndex: number,
): DayStatus => {
  if (selectedIndex === index) return "isSelected";
  if (schedule[index].length > 0) return "hasTime";
  return "empty";
};

type DayCircleProps = {
  dayStatus: DayStatus;
  onClick: () => void;
  disabled?: boolean;
  name: string;
};

const DayCircle = ({ dayStatus, onClick, disabled, name }: DayCircleProps) => {
  if (dayStatus === "hasTime")
    return (
      <div className="relative">
        <button
          type="button"
          className={`numberCircle bg-green-100`}
          onClick={onClick}
          disabled={disabled}
        >
          <div>{name}</div>
        </button>
        <div className="absolute -top-2 right-0">
          <CheckCircleIcon sx={{ color: "#07b601" }} fontSize="small" />
        </div>
      </div>
    );

  return (
    <button
      type="button"
      className={`numberCircle ${dayStatus === "isSelected" ? "selected" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div>{name}</div>
    </button>
  );
};
