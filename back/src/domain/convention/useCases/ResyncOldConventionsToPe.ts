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

export class ResyncOldConventionToPe extends TransactionalUseCase<
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
    conventionToSync: ConventionToSync,
  ) {
    try {
      await this.resync(uow, conventionToSync);
      const updatedConventionToSync =
        await uow.conventionToSyncRepository.getById(conventionToSync.id);
      if (updatedConventionToSync === undefined) {
        this.report.errors[conventionToSync.id] = new Error(
          "Convention not found or no status",
        );
        return;
      }
      if (updatedConventionToSync.status === "TO_PROCESS") {
        this.report.errors[conventionToSync.id] = new Error(
          "Convention still have status TO_PROCESS",
        );
      }
      if (updatedConventionToSync.status === "SUCCESS")
        this.report.success += 1;
      if (updatedConventionToSync.status === "SKIP") {
        this.report.skips[conventionToSync.id] = updatedConventionToSync.reason;
      }
      if (updatedConventionToSync.status === "ERROR") {
        this.report.errors[conventionToSync.id] = new Error(
          updatedConventionToSync.reason,
        );
      }
      // const strategy: {
      //   [K in ConventionToSync["status"]]: (
      //     conventionCase: Extract<ConventionToSync, { status: K }>,
      //   ) => void;
      // } = {
      //   SUCCESS: () => {
      //     this.report.success += 1;
      //   },
      //   TO_PROCESS: () => {
      //     this.report.errors[conventionToSync.id] = new Error(
      //       "Convention still have status TO_PROCESS",
      //     );
      //   },
      //   SKIP: (conventionCase) => {
      //     this.report.skips[conventionToSync.id] = conventionCase.reason;
      //   },
      //   ERROR: (conventionCase) => {
      //     this.report.errors[conventionToSync.id] = new Error(
      //       conventionCase.reason,
      //     );
      //   },
      // };
      // strategy[updatedConventionToSync.status](updatedConventionToSync);
    } catch (error) {
      const anError =
        error instanceof Error
          ? error
          : new Error("Not an Error: " + JSON.stringify(error));
      await uow.conventionToSyncRepository.save({
        id: conventionToSync.id,
        status: "ERROR",
        processDate: this.timeGateway.now(),
        reason: anError.message,
      });
      this.report.errors[conventionToSync.id] = anError;
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
      true,
    ).execute(convention);
  }

  private report: ResyncOldConventionToPeReport = {
    errors: {},
    skips: {},
    success: 0,
  };
}
