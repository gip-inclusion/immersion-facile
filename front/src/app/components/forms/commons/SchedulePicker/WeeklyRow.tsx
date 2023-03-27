import { parseISO } from "date-fns";
import React from "react";
import {
  calculateWeeklyHours,
  ConventionReadDto,
  WeeklyImmersionTimetableDto,
} from "shared";
import { DayCircle } from "./DayCircle";
import { HourIndicator } from "./HourIndicator";
import { getDayStatus } from "./utils/getDayStatus";
import { fr } from "@codegouvfr/react-dsfr";
import { useFormContext } from "react-hook-form";

type WeeklyRowProperties = {
  weeklyCalendar: WeeklyImmersionTimetableDto;
  week: number;
  selectedIndex: number;
  disabled?: boolean;
  onChange: (index: number) => void;
};
const makeName = (isoStringDate: string) => {
  const date = parseISO(isoStringDate);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};
export const WeeklyRow = ({
  weeklyCalendar,
  selectedIndex,
  disabled,
  onChange,
}: WeeklyRowProperties) => {
  const { getValues } = useFormContext<ConventionReadDto>();
  const values = getValues();
  return (
    <div className={fr.cx("fr-grid-row", "fr-mt-1w", "fr-grid-row--middle")}>
      {weeklyCalendar.map((dayOfWeek) =>
        dayOfWeek.dailySchedule !== null ? (
          <DayCircle
            key={dayOfWeek.key.toString()}
            name={makeName(dayOfWeek.dailySchedule.date)}
            dayStatus={getDayStatus(
              dayOfWeek.dailySchedule,
              dayOfWeek.key,
              selectedIndex,
            )}
            disabled={disabled}
            onClick={() => onChange(dayOfWeek.key)}
          />
        ) : (
          <DayCircle
            key={dayOfWeek.key.toString()}
            name={`x`}
            dayStatus={"empty"}
            disabled={true}
          />
        ),
      )}
      <HourIndicator
        hours={calculateWeeklyHours(weeklyCalendar)}
        internshipKind={values.internshipKind}
        birthdate={values.signatories.beneficiary.birthdate}
      />
    </div>
  );
};
