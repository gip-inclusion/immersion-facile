import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import React from "react";
import { DayStatus } from "./utils/getDayStatus";

type DayCircleProps = {
  dayStatus: DayStatus;
  onClick?: () => void;
  disabled?: boolean;
  name: string;
};
export const DayCircle = ({
  dayStatus,
  onClick,
  disabled,
  name,
}: DayCircleProps) => {
  if (dayStatus === "hasTime")
    return (
      <div className="relative">
        <button
          type="button"
          className={`numberCircle `}
          style={{ backgroundColor: "#B8FEC9" }}
          onClick={onClick}
          disabled={disabled}
        >
          <div>{name}</div>
        </button>
        <div className="absolute -top-2 right-0">
          <CheckCircleIcon sx={{ color: "#1F8D49" }} fontSize="small" />
        </div>
      </div>
    );

  return (
    <div>
      <button
        type="button"
        className={`numberCircle ${
          dayStatus === "isSelected" ? "selected" : ""
        }`}
        //className={`w-11 h-11 `}
        onClick={onClick}
        disabled={disabled}
      >
        {name}
      </button>
    </div>
  );
};
