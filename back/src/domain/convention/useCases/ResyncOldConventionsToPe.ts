import { match } from "ts-pattern";
import { z } from "zod";
import { ConventionId } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { PoleEmploiGateway } from "../ports/PoleEmploiGateway";
import { BroadcastToPoleEmploiOnConventionUpdates } from "./broadcast/BroadcastToPoleEmploiOnConventionUpdates";

type ResyncOldConventionToPeReport = {
  success: number;
  skips: Record<ConventionId, string>;
  errors: Record<ConventionId, Error>;
};

export class ResyncOldConventionsToPe extends TransactionalUseCase<
  void,
  ResyncOldConventionToPeReport
> {
  constructor(
    private uowPerform: UnitOfWorkPerformer,
    private poleEmploiGateway: PoleEmploiGateway,
    private timeGateway: TimeGateway,
    private limit: number,
  ) {
    super(uowPerform);
    this.broadcastToPeUsecase = new BroadcastToPoleEmploiOnConventionUpdates(
      this.uowPerform,
      this.poleEmploiGateway,
      this.timeGateway,
      { resyncMode: true },
    );
  }

  protected override inputSchema = z.void();

  public async _execute(
    _: void,
    uow: UnitOfWork,
  ): Promise<ResyncOldConventionToPeReport> {
    const conventionsToSync =
      await uow.conventionsToSyncRepository.getToProcessOrError(this.limit);
    await Promise.all(
      conventionsToSync.map((conventionToSync) =>
        this.handleConventionToSync(uow, conventionToSync.id),
      ),
    );

    return this.report;
  }

  private async handleConventionToSync(
    uow: UnitOfWork,
    conventionToSyncId: ConventionId,
  ) {
    try {
      await this.resync(uow, conventionToSyncId);
      const updatedConventionToSync =
        await uow.conventionsToSyncRepository.getById(conventionToSyncId);

      match(updatedConventionToSync)
        .with(undefined, () => {
          this.report.errors[conventionToSyncId] = new Error(
            "Convention not found or no status",
          );
        })
        .with({ status: "SUCCESS" }, () => {
          this.report.success += 1;
        })
        .with({ status: "TO_PROCESS" }, (toProcessConventionToSync) => {
          this.report.errors[toProcessConventionToSync.id] = new Error(
            "Convention still have status TO_PROCESS",
          );
        })
        .with({ status: "ERROR" }, (errorConventionToSync) => {
          this.report.errors[errorConventionToSync.id] = new Error(
            errorConventionToSync.reason,
          );
        })
        .with({ status: "SKIP" }, (skipConventionToSync) => {
          this.report.skips[skipConventionToSync.id] =
            skipConventionToSync.reason;
        })
        .exhaustive();
    } catch (error) {
      const anError =
        error instanceof Error
          ? error
          : new Error("Not an Error: " + JSON.stringify(error));
      await uow.conventionsToSyncRepository.save({
        id: conventionToSyncId,
        status: "ERROR",
        processDate: this.timeGateway.now(),
        reason: anError.message,
      });
      this.report.errors[conventionToSyncId] = anError;
    }
  }

  private async resync(
    uow: UnitOfWork,
    conventionToSyncId: ConventionId,
  ): Promise<void> {
    const convention = await uow.conventionRepository.getById(
      conventionToSyncId,
    );
    if (!convention)
      throw new NotFoundError(
        `Convention with id ${conventionToSyncId} missing in conventionRepository.`,
      );
    return this.broadcastToPeUsecase.execute(convention);
  }

  private broadcastToPeUsecase: BroadcastToPoleEmploiOnConventionUpdates;
  private report: ResyncOldConventionToPeReport = {
    errors: {},
    skips: {},
    success: 0,
  };
}
