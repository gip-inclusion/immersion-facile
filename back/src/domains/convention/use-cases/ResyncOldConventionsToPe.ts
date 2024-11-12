import { ConventionId, errors } from "shared";
import { match } from "ts-pattern";
import { z } from "zod";
import { TransactionalUseCase } from "../../core/UseCase";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { PoleEmploiGateway } from "../ports/PoleEmploiGateway";
import { BroadcastToFranceTravailOnConventionUpdates } from "./broadcast/BroadcastToFranceTravailOnConventionUpdates";

type ResyncOldConventionToPeReport = {
  success: number;
  skips: Record<ConventionId, string>;
  errors: Record<ConventionId, Error>;
};

export class ResyncOldConventionsToPe extends TransactionalUseCase<
  void,
  ResyncOldConventionToPeReport
> {
  protected override inputSchema = z.void();

  readonly #broadcastToPeUsecase: BroadcastToFranceTravailOnConventionUpdates;

  #report: ResyncOldConventionToPeReport = {
    errors: {},
    skips: {},
    success: 0,
  };

  readonly #timeGateway: TimeGateway;

  readonly #limit: number;

  constructor(
    uowPerform: UnitOfWorkPerformer,
    poleEmploiGateway: PoleEmploiGateway,
    timeGateway: TimeGateway,
    limit: number,
  ) {
    super(uowPerform);
    this.#broadcastToPeUsecase =
      new BroadcastToFranceTravailOnConventionUpdates(
        uowPerform,
        poleEmploiGateway,
        timeGateway,
        { resyncMode: true },
      );

    this.#timeGateway = timeGateway;
    this.#limit = limit;
  }

  public async _execute(
    _: void,
    uow: UnitOfWork,
  ): Promise<ResyncOldConventionToPeReport> {
    const conventionsToSync =
      await uow.conventionsToSyncRepository.getToProcessOrError(this.#limit);
    await Promise.all(
      conventionsToSync.map((conventionToSync) =>
        this.#handleConventionToSync(uow, conventionToSync.id),
      ),
    );

    return this.#report;
  }

  async #handleConventionToSync(
    uow: UnitOfWork,
    conventionToSyncId: ConventionId,
  ) {
    try {
      await this.#resync(uow, conventionToSyncId);
      const updatedConventionToSync =
        await uow.conventionsToSyncRepository.getById(conventionToSyncId);

      match(updatedConventionToSync)
        .with(undefined, () => {
          this.#report.errors[conventionToSyncId] = new Error(
            "Convention not found or no status",
          );
        })
        .with({ status: "SUCCESS" }, () => {
          this.#report.success += 1;
        })
        .with({ status: "TO_PROCESS" }, (toProcessConventionToSync) => {
          this.#report.errors[toProcessConventionToSync.id] = new Error(
            "Convention still have status TO_PROCESS",
          );
        })
        .with({ status: "ERROR" }, (errorConventionToSync) => {
          this.#report.errors[errorConventionToSync.id] = new Error(
            errorConventionToSync.reason,
          );
        })
        .with({ status: "SKIP" }, (skipConventionToSync) => {
          this.#report.skips[skipConventionToSync.id] =
            skipConventionToSync.reason;
        })
        .exhaustive();
    } catch (error) {
      const anError =
        error instanceof Error
          ? error
          : new Error(`Not an Error: ${JSON.stringify(error)}`);
      await uow.conventionsToSyncRepository.save({
        id: conventionToSyncId,
        status: "ERROR",
        processDate: this.#timeGateway.now(),
        reason: anError.message,
      });
      this.#report.errors[conventionToSyncId] = anError;
    }
  }

  async #resync(
    uow: UnitOfWork,
    conventionToSyncId: ConventionId,
  ): Promise<void> {
    const convention =
      await uow.conventionRepository.getById(conventionToSyncId);
    if (!convention)
      throw errors.convention.notFound({
        conventionId: conventionToSyncId,
      });
    return this.#broadcastToPeUsecase.execute({ convention });
  }
}
