import subDays from "date-fns/subDays";
import { keys } from "ramda";
import type { SiretDto, SiretEstablishmentDto } from "shared";
import { z } from "zod/v4";
import type { SiretGateway } from "../../core/sirene/ports/SiretGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type {
  UpdateEstablishmentsWithInseeDataParams,
  ValuesToUpdateFromInseeApi,
} from "../ports/EstablishmentAggregateRepository";

type Report = {
  numberOfEstablishmentsToUpdate: number;
  establishmentWithNewData: number;
  callsToInseeApi: number;
};

type BatchReport = {
  numberOfEstablishmentsToUpdateInBatch: number;
  establishmentWithNewDataInBatch: number;
};

export class UpdateEstablishmentsFromSirenApiScript extends UseCase<
  void,
  Report
> {
  protected inputSchema = z.void();

  #callsToInseeApi = 0;

  readonly #uowPerformer: UnitOfWorkPerformer;

  readonly #siretGateway: SiretGateway;

  readonly #timeGateway: TimeGateway;

  readonly #numberOfDaysAgoToCheckForInseeUpdates: number;

  readonly #maxEstablishmentsPerBatch: number;

  readonly #maxEstablishmentsPerFullRun: number;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    siretGateway: SiretGateway,
    timeGateway: TimeGateway,
    numberOfDaysAgoToCheckForInseeUpdates = 30,
    maxEstablishmentsPerBatch = 1000,
    maxEstablishmentsPerFullRun = 5000,
  ) {
    super();

    this.#uowPerformer = uowPerformer;
    this.#siretGateway = siretGateway;
    this.#timeGateway = timeGateway;
    this.#numberOfDaysAgoToCheckForInseeUpdates =
      numberOfDaysAgoToCheckForInseeUpdates;
    this.#maxEstablishmentsPerBatch = maxEstablishmentsPerBatch;
    this.#maxEstablishmentsPerFullRun = maxEstablishmentsPerFullRun;
  }

  public async _execute(_: void): Promise<Report> {
    this.#callsToInseeApi = 0;
    const now = this.#timeGateway.now();
    const since = subDays(now, this.#numberOfDaysAgoToCheckForInseeUpdates);

    let offset = 0;
    let numberOfEstablishmentsToUpdate = 0;
    let establishmentWithNewData = 0;

    while (this.#maxEstablishmentsPerFullRun > offset) {
      const {
        numberOfEstablishmentsToUpdateInBatch,
        establishmentWithNewDataInBatch,
      } = await this.#processOneBatch(now, since);

      numberOfEstablishmentsToUpdate += numberOfEstablishmentsToUpdateInBatch;
      establishmentWithNewData += establishmentWithNewDataInBatch;

      const areThereMoreEstablishmentsToUpdate =
        numberOfEstablishmentsToUpdateInBatch ===
        this.#maxEstablishmentsPerBatch;

      offset = areThereMoreEstablishmentsToUpdate
        ? offset + this.#maxEstablishmentsPerBatch
        : this.#maxEstablishmentsPerFullRun;
    }

    return {
      numberOfEstablishmentsToUpdate,
      establishmentWithNewData,
      callsToInseeApi: this.#callsToInseeApi,
    };
  }

  async #getEstablishmentsUpdatesFromInsee(
    since: Date,
    now: Date,
    establishmentSiretsToUpdate: SiretDto[],
  ): Promise<Partial<Record<SiretDto, SiretEstablishmentDto>>> {
    if (establishmentSiretsToUpdate.length > 0) {
      const results = await this.#siretGateway.getEstablishmentUpdatedBetween(
        since,
        now,
        establishmentSiretsToUpdate,
      );
      this.#callsToInseeApi++;
      return results;
    }

    return {};
  }

  #processOneBatch = async (
    now: Date,
    since: Date,
    // offset: number,
  ): Promise<BatchReport> => {
    const establishmentSiretsToUpdate: SiretDto[] =
      await this.#uowPerformer.perform(async (uow: UnitOfWork) =>
        uow.establishmentAggregateRepository.getSiretsOfEstablishmentsNotCheckedAtInseeSince(
          since,
          this.#maxEstablishmentsPerBatch,
        ),
      );

    const siretEstablishmentsWithChanges =
      await this.#getEstablishmentsUpdatesFromInsee(
        since,
        now,
        establishmentSiretsToUpdate,
      );

    const paramsToUpdate: UpdateEstablishmentsWithInseeDataParams =
      establishmentSiretsToUpdate.reduce(
        (acc, siret): UpdateEstablishmentsWithInseeDataParams => ({
          ...acc,
          [siret]: siretEstablishmentToValuesToUpdateInEstablishment(
            siretEstablishmentsWithChanges[siret],
          ),
        }),
        {} satisfies UpdateEstablishmentsWithInseeDataParams,
      );

    await this.#uowPerformer.perform(async (uow: UnitOfWork) =>
      uow.establishmentAggregateRepository.updateEstablishmentsWithInseeData(
        now,
        paramsToUpdate,
      ),
    );

    return {
      numberOfEstablishmentsToUpdateInBatch: establishmentSiretsToUpdate.length,
      establishmentWithNewDataInBatch: keys(siretEstablishmentsWithChanges)
        .length,
    };
  };
}

const siretEstablishmentToValuesToUpdateInEstablishment = (
  params: Partial<SiretEstablishmentDto> = {},
): Partial<ValuesToUpdateFromInseeApi> => ({
  ...(params.nafDto !== undefined ? { nafDto: params.nafDto } : {}),
  ...(params.businessName !== undefined ? { name: params.businessName } : {}),
  ...(params.isOpen !== undefined ? { isOpen: params.isOpen } : {}),
  ...(params.numberEmployeesRange !== undefined
    ? { numberEmployeesRange: params.numberEmployeesRange }
    : {}),
});
