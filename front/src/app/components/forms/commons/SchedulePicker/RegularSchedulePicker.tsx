import { useField } from "formik";
import React from "react";
import {
  calculateNumberOfWorkedDays,
  calculateTotalImmersionHoursFromComplexSchedule,
  calculateWeeklyHoursFromSchedule,
  ConventionDto,
  DailyScheduleDto,
  DateIntervalDto,
  DayPeriodsDto,
  dayPeriodsFromComplexSchedule,
  regularTimePeriods,
  ScheduleDto,
  ScheduleDtoBuilder,
} from "shared";

import { HourPicker } from "./HourPicker";
import { TotalWeeklyHoursIndicator } from "./TotaWeeklylHoursIndicator";
import { WeekdayPicker } from "./WeekdayPicker";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

export type RegularSchedulePickerProps = {
  interval: DateIntervalDto;
  disabled?: boolean;
};

export const RegularSchedulePicker = (props: RegularSchedulePickerProps) => {
  const { cx } = useStyles();
  const name: keyof ConventionDto = "schedule";
  const [field, _, { setValue }] = useField<ScheduleDto>({ name });
  return (
    <>
      <div
        className={cx(
          fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-2w"),
          "schedule-picker",
          "schedule-picker--regular",
        )}
      >
        <div
          className={cx(
            fr.cx("fr-col-12", "fr-col-lg-8"),
            "schedule-picker__inner",
          )}
        >
          <WeekdayPicker
            name={name}
            dayPeriods={dayPeriodsFromComplexSchedule(
              field.value.complexSchedule,
            )}
            onValueChange={(dayPeriods: DayPeriodsDto) => {
              field.value = new ScheduleDtoBuilder(field.value)
                .withEmptyComplexSchedule(props.interval)
                .withRegularSchedule({
                  dayPeriods,
                  timePeriods: regularTimePeriods(field.value),
                })
                .build();
              setValue(field.value);
            }}
            interval={props.interval}
            disabled={props.disabled}
          />

          <p className={fr.cx("fr-h5", "fr-mt-2w")}>
            Sélectionnez les horaires
          </p>

          <HourPicker
            name={name}
            timePeriods={regularTimePeriods(field.value)}
            onValueChange={(newHours) => {
              const complexSchedule = field.value.complexSchedule.map(
                (dailySchedule): DailyScheduleDto => ({
                  date: dailySchedule.date,
                  timePeriods: newHours,
                }),
              );
              const schedule: ScheduleDto = { ...field.value, complexSchedule };
              schedule.totalHours =
                calculateTotalImmersionHoursFromComplexSchedule(
                  schedule.complexSchedule,
                );
              schedule.workedDays = calculateNumberOfWorkedDays(
                schedule.complexSchedule,
              );
              setValue(schedule);
            }}
            disabled={props.disabled}
          />
        </div>
        <div
          className={cx(
            fr.cx("fr-col-12", "fr-col-lg-4"),
            "schedule-picker__week-hours-summary",
          )}
        >
          <p className={fr.cx("fr-text--sm", "fr-mb-1w")}>
            <strong>Récapitulatif hebdomadaire</strong>
          </p>
          <hr className={fr.cx("fr-hr", "fr-pb-1w")} />
          <WeeksHoursIndicator schedule={field.value} />
        </div>
      </div>
    </>
  );
};

const WeeksHoursIndicator = ({
  schedule,
}: {
  schedule: ScheduleDto;
}): JSX.Element => (
  <ul>
    {calculateWeeklyHoursFromSchedule(schedule).map((weekTotalHours, index) => (
      <TotalWeeklyHoursIndicator
        key={`weeklyHoursIndicator-${index}`}
        week={index + 1}
        totalHours={weekTotalHours}
      />
    ))}
  </ul>
);
