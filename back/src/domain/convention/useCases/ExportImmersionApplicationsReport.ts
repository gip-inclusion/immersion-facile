import { groupBy, map, prop } from "ramda";
import { pipeWithValue } from "shared/src/pipeWithValue";
import { z } from "zod";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ExportImmersionApplicationsReport extends TransactionalUseCase<string> {
  inputSchema = z.string();

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    archivePath: string,
    uow: UnitOfWork,
  ): Promise<void> {
    const report = pipeWithValue(
      await uow.conventionQueries.getAllConventionsForExport(),
      map((conventionRawBeforeExportVO) =>
        conventionRawBeforeExportVO.toImmersionApplicationReadyForExportVO(),
      ),
      groupBy(prop("agencyName")),
    );
    await uow.reportingGateway.exportConventions({
      report,
      archivePath,
    });
  }
}
