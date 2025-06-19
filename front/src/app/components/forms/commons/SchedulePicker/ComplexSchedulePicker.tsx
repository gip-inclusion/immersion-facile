import { fr } from "@codegouvfr/react-dsfr";
import { isSameDay } from "date-fns";
import { clone } from "ramda";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  type ConventionDto,
  type ConventionReadDto,
  calculateNumberOfWorkedDays,
  calculateTotalImmersionHoursFromComplexSchedule,
  convertLocaleDateToUtcTimezoneDate,
  type ScheduleDto,
  type TimePeriodsDto,
} from "shared";
import { useStyles } from "tss-react/dsfr";
import { DayPicker } from "./DayPicker";
import { HourPicker } from "./HourPicker";

type ComplexSchedulePickerProps = {
  disabled?: boolean;
};

export const ComplexSchedulePicker = ({
  disabled,
}: ComplexSchedulePickerProps) => {
  const { cx } = useStyles();
  const name: keyof ConventionDto = "schedule";
  const { setValue, getValues } = useFormContext<ConventionReadDto>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const values = getValues();
  return (
    <div
      className={cx(
        fr.cx("fr-mb-2w"),
        "schedule-picker",
        "schedule-picker--complex",
      )}
    >
      <div className="schedule-day-picker">
        <DayPicker
          complexSchedule={values.schedule.complexSchedule}
          selectedDate={selectedDate}
          interval={{
            start: convertLocaleDateToUtcTimezoneDate(
              new Date(values.dateStart),
            ),
            end: convertLocaleDateToUtcTimezoneDate(new Date(values.dateEnd)),
          }}
          onChange={(lastSelectedDate) => {
            const updatedSchedule = clone(values.schedule);
            setSelectedDate(lastSelectedDate);
            setValue(name, updatedSchedule);
          }}
        />
      </div>
      <div className={cx(fr.cx("fr-my-3w"), "schedule-hour-picker")}>
        {selectedDate ? (
          <>
            <p>
              Définissez les horaires du{" "}
              {selectedDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "2-digit",
              })}{" "}
              :
            </p>
            <HourPicker
              name={name}
              timePeriods={
                values.schedule.complexSchedule.find(
                  (dailySchedule) =>
                    selectedDate &&
                    isSameDay(
                      selectedDate,
                      convertLocaleDateToUtcTimezoneDate(
                        new Date(dailySchedule.date),
                      ),
                    ),
                )?.timePeriods ?? []
              }
              onValueChange={(newTimePeriods) => {
                setValue(
                  name,
                  makeUpdatedScheduleWithTimePeriodForSelectedDate(
                    values.schedule,
                    selectedDate,
                    newTimePeriods,
                  ),
                  {
                    shouldValidate: true,
                  },
                );
              }}
              disabled={disabled}
            />
          </>
        ) : (
          <p className={fr.cx("fr-hint-text")}>
            Veuillez sélectionner un jour dans le planning si vous souhaitez
            modifier les horaires du jour.
          </p>
        )}
      </div>
    </div>
  );
};

const makeUpdatedScheduleWithTimePeriodForSelectedDate = (
  schedule: ScheduleDto,
  selectedDate: Date | undefined,
  newTimePeriods: TimePeriodsDto,
): ScheduleDto => {
  const newComplexSchedule = schedule.complexSchedule.map((dailySchedule) =>
    selectedDate &&
    isSameDay(
      selectedDate,
      convertLocaleDateToUtcTimezoneDate(new Date(dailySchedule.date)),
    )
      ? {
          ...dailySchedule,
          timePeriods: newTimePeriods,
        }
      : dailySchedule,
  );

  return {
    isSimple: schedule.isSimple,
    complexSchedule: newComplexSchedule,
    totalHours:
      calculateTotalImmersionHoursFromComplexSchedule(newComplexSchedule),
    workedDays: calculateNumberOfWorkedDays(newComplexSchedule),
  };
};
