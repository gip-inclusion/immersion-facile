import { ListImmersionApplicationsWithComputedWeeklyHours } from "../../../domain/immersionApplication/useCases/ListImmersionApplicationsWithComputedWeeklyHours";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { createInMemoryUow } from "../../../adapters/primary/config";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import { reasonableSchedule } from "../../../shared/ScheduleSchema";
import { expectTypeToMatchAndEqual } from "../../../_testBuilders/test.helpers";

describe("List Immersion Applications With Computed Weekly Hours", (): void => {
  it("should have weekly hours added to immersion application", async () => {
    const immersionApplicationWith35Hours =
      new ImmersionApplicationEntityBuilder()
        .withId("123")
        .withSchedule(reasonableSchedule)
        .build();

    const immersionApplicationWith14Hours =
      new ImmersionApplicationEntityBuilder()
        .withId("456")
        .withSchedule({
          ...reasonableSchedule,
          simpleSchedule: {
            ...reasonableSchedule.simpleSchedule,
            dayPeriods: [[0, 1]],
          },
        })
        .build();

    const unitOfWork = createInMemoryUow();
    unitOfWork.immersionApplicationRepo.setImmersionApplications({
      [immersionApplicationWith35Hours.id]: immersionApplicationWith35Hours,
      [immersionApplicationWith14Hours.id]: immersionApplicationWith14Hours,
    });

    const uowPerformer = new InMemoryUowPerformer(unitOfWork);

    const listImmersionApplicationWithComputedWeeklyHours =
      new ListImmersionApplicationsWithComputedWeeklyHours(uowPerformer);

    expectTypeToMatchAndEqual(
      await listImmersionApplicationWithComputedWeeklyHours.execute(),
      [
        { ...immersionApplicationWith35Hours.toDto(), weeklyHours: 35 },
        { ...immersionApplicationWith14Hours.toDto(), weeklyHours: 14 },
      ],
    );
  });
});
