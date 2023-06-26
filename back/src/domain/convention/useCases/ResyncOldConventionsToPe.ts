import { match } from "ts-pattern";
import { z } from "zod";
import { ConventionId } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { ConventionToSync } from "../ports/ConventionToSyncRepository";
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
  }

  protected override inputSchema = z.void();

  public async _execute(
    _: void,
    uow: UnitOfWork,
  ): Promise<ResyncOldConventionToPeReport> {
    const conventionsToSync =
      await uow.conventionToSyncRepository.getNotProcessedAndErrored(
        this.limit,
      );
    await Promise.all(
      conventionsToSync.map((conventionToSync) =>
        this.handleConventionToSync(uow, conventionToSync),
      ),
    );

    return this.report;
  }

  private async handleConventionToSync(
    uow: UnitOfWork,
    payload: ConventionToSync,
  ) {
    try {
      await this.resync(uow, payload);
      const updatedConventionToSync =
        await uow.conventionToSyncRepository.getById(payload.id);

      match(updatedConventionToSync)
        .with(undefined, () => {
          this.report.errors[payload.id] = new Error(
            "Convention not found or no status",
          );
        })
        .with({ status: "SUCCESS" }, () => {
          this.report.success += 1;
        })
        .with({ status: "TO_PROCESS" }, (conventionToSync) => {
          this.report.errors[conventionToSync.id] = new Error(
            "Convention still have status TO_PROCESS",
          );
        })
        .with({ status: "ERROR" }, (conventionToSync) => {
          this.report.errors[conventionToSync.id] = new Error(
            conventionToSync.reason,
          );
        })
        .with({ status: "SKIP" }, (conventionToSync) => {
          this.report.skips[conventionToSync.id] = conventionToSync.reason;
        })
        .exhaustive();
    } catch (error) {
      const anError =
        error instanceof Error
          ? error
          : new Error("Not an Error: " + JSON.stringify(error));
      await uow.conventionToSyncRepository.save({
        id: payload.id,
        status: "ERROR",
        processDate: this.timeGateway.now(),
        reason: anError.message,
      });
      this.report.errors[payload.id] = anError;
    }
  }

  private async resync(
    uow: UnitOfWork,
    conventionToSync: ConventionToSync,
  ): Promise<void> {
    const convention = await uow.conventionRepository.getById(
      conventionToSync.id,
    );
    if (!convention)
      throw new NotFoundError(
        `Convention with id ${conventionToSync.id} missing in conventionRepository.`,
      );
    await new BroadcastToPoleEmploiOnConventionUpdates(
      this.uowPerform,
      this.poleEmploiGateway,
      this.timeGateway,
      { resyncMode: true },
    ).execute(convention);
  }

  private report: ResyncOldConventionToPeReport = {
    errors: {},
    skips: {},
    success: 0,
  };
}
