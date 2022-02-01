import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { z } from "zod";
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { calculateHours } from "../../../shared/ScheduleUtils";

type ImmersionApplicationDtoWithWeeklyHours = ImmersionApplicationDto & {
  weeklyHours: number;
};

export class ListImmersionApplicationsWithComputedWeeklyHours extends TransactionalUseCase<
  void,
  ImmersionApplicationDtoWithWeeklyHours[]
> {
  inputSchema = z.void();

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    params: void,
    uow: UnitOfWork,
  ): Promise<ImmersionApplicationDtoWithWeeklyHours[]> {
    const entities: ImmersionApplicationEntity[] =
      await uow.immersionApplicationRepo.getAll();

    return entities.map((e) => {
      const dto = e.toDto();
      const weeklyHours = calculateHours(dto.schedule);

      return { ...dto, weeklyHours };
    });
  }
}
