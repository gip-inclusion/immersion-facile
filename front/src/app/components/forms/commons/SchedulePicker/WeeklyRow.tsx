import React from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { parseISO } from "date-fns";
import {
  calculateWeeklyHours,
  ConventionReadDto,
  WeeklyImmersionTimetableDto,
} from "shared";
import { getDayStatus } from "./utils/getDayStatus";
import { DayCircle } from "./DayCircle";
import { HourIndicator } from "./HourIndicator";

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
        dayOfWeek.timePeriods !== null ? (
          <DayCircle
            key={dayOfWeek.key.toString()}
            name={makeName(dayOfWeek.date)}
            dayStatus={getDayStatus(
              dayOfWeek.timePeriods,
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
