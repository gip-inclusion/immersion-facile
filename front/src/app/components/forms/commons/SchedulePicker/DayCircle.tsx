import React from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useStyles } from "tss-react/dsfr";
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
  const { cx } = useStyles();
  if (dayStatus === "hasTime")
    return (
      <div className={cx("schedule-picker__day-circle")}>
        <button
          type="button"
          className={cx(`numberCircle`)}
          style={{ backgroundColor: "#B8FEC9" }}
          onClick={onClick}
          disabled={disabled}
        >
          <div>{name}</div>
        </button>
        <div className={cx("schedule-picker__day-circle-icon")}>
          <CheckCircleIcon sx={{ color: "#1F8D49" }} fontSize="small" />
        </div>
      </div>
    );

  return (
    <div>
      <button
        type="button"
        className={cx(
          "numberCircle",
          `${dayStatus === "isSelected" && "selected"}`,
        )}
        onClick={onClick}
        disabled={disabled}
      >
        {name}
      </button>
    </div>
  );
};
