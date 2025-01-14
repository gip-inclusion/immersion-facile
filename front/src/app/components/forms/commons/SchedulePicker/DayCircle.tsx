import checkCircleIconSvg from "src/assets/img/check-circle-icon.svg";

import React from "react";
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
          className={cx("numberCircle")}
          style={{ backgroundColor: "#B8FEC9" }}
          onClick={onClick}
          disabled={disabled}
          id={`im-schedule-regular__day--${name}`}
        >
          <div>{name}</div>
        </button>
        <div className={cx("schedule-picker__day-circle-icon")}>
          <img src={checkCircleIconSvg} alt="" />
        </div>
      </div>
    );

  return (
    <div className={cx("schedule-picker__day-circle")}>
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
