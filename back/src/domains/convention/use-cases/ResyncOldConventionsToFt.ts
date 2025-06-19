import { type ConventionId, errors } from "shared";
import { match } from "ts-pattern";
import { z } from "zod";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { FranceTravailGateway } from "../ports/FranceTravailGateway";
import {
  type BroadcastToFranceTravailOnConventionUpdates,
  makeBroadcastToFranceTravailOnConventionUpdates,
} from "./broadcast/BroadcastToFranceTravailOnConventionUpdates";
import {
  type BroadcastToFranceTravailOnConventionUpdatesLegacy,
  makeBroadcastToFranceTravailOnConventionUpdatesLegacy,
} from "./broadcast/BroadcastToFranceTravailOnConventionUpdatesLegacy";

type ResyncOldConventionToFtReport = {
  success: number;
  skips: Record<ConventionId, string>;
  errors: Record<ConventionId, Error>;
};

export class ResyncOldConventionsToFt extends TransactionalUseCase<
  void,
  ResyncOldConventionToFtReport
> {
  protected override inputSchema = z.void();

  readonly #legacyBroadcastToFTUsecase: BroadcastToFranceTravailOnConventionUpdatesLegacy;
  readonly #standardBroadcastToFTUsecase: BroadcastToFranceTravailOnConventionUpdates;

  #report: ResyncOldConventionToFtReport = {
    errors: {},
    skips: {},
    success: 0,
  };

  readonly #timeGateway: TimeGateway;

  readonly #limit: number;

  constructor(
    uowPerform: UnitOfWorkPerformer,
    franceTravailGateway: FranceTravailGateway,
    timeGateway: TimeGateway,
    limit: number,
  ) {
    super(uowPerform);
    this.#legacyBroadcastToFTUsecase =
      makeBroadcastToFranceTravailOnConventionUpdatesLegacy({
        uowPerformer: uowPerform,
        deps: {
          franceTravailGateway,
          timeGateway,
          options: { resyncMode: true },
        },
      });
    this.#standardBroadcastToFTUsecase =
      makeBroadcastToFranceTravailOnConventionUpdates({
        uowPerformer: uowPerform,
        deps: {
          franceTravailGateway,
          timeGateway,
          options: { resyncMode: true },
        },
      });

    this.#timeGateway = timeGateway;
    this.#limit = limit;
  }

  public async _execute(
    _: void,
    uow: UnitOfWork,
  ): Promise<ResyncOldConventionToFtReport> {
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
      const { enableStandardFormatBroadcastToFranceTravail } =
        await uow.featureFlagRepository.getAll();
      await this.#resync({
        uow: uow,
        conventionToSyncId: conventionToSyncId,
        isLegacy: !enableStandardFormatBroadcastToFranceTravail.isActive,
      });
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

  async #resync({
    uow,
    conventionToSyncId,
    isLegacy,
  }: {
    uow: UnitOfWork;
    conventionToSyncId: ConventionId;
    isLegacy: boolean;
  }): Promise<void> {
    const convention =
      await uow.conventionRepository.getById(conventionToSyncId);
    if (!convention)
      throw errors.convention.notFound({
        conventionId: conventionToSyncId,
      });
    return isLegacy
      ? this.#legacyBroadcastToFTUsecase.execute({ convention })
      : this.#standardBroadcastToFTUsecase.execute({
          eventType: "CONVENTION_UPDATED",
          convention,
        });
  }
}
