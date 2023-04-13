import { addDays } from "date-fns";
import { z } from "zod";

import { AddressAndPosition } from "shared";

import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UseCase } from "../../core/UseCase";
import { SirenGateway } from "../../sirene/ports/SirenGateway";
import { getSirenEstablishmentFromApi } from "../../sirene/service/getSirenEstablishmentFromApi";
import { AddressGateway } from "../ports/AddressGateway";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";

const SIRENE_NB_DAYS_BEFORE_REFRESH = 7;

const logger = createLogger(__filename);

export class UpdateEstablishmentsFromSirenApiScript extends UseCase<
  void,
  number
> {
  constructor(
    private readonly establishmentAggregateRepository: EstablishmentAggregateRepository,
    private readonly sirenGateway: SirenGateway,
    private readonly addressAPI: AddressGateway,
    private readonly timeGateway: TimeGateway,
  ) {
    super();
  }

  inputSchema = z.void();

  public async _execute() {
    const since = addDays(
      this.timeGateway.now(),
      -SIRENE_NB_DAYS_BEFORE_REFRESH,
    );
    const establishmentSiretsToUpdate =
      await this.establishmentAggregateRepository.getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince(
        since,
      );

    logger.info(
      `Found ${establishmentSiretsToUpdate.length} establishments to update`,
    );

    // TODO parallelize this using Promise.all once we know it works :)
    for (const siret of establishmentSiretsToUpdate) {
      try {
        await this.updateEstablishmentWithSiret(siret);
      } catch (error) {
        logger.warn(
          "Accountered an error when updating establishment with siret :",
          siret,
          error,
        );
      }
    }

    return establishmentSiretsToUpdate.length;
  }

  private async updateEstablishmentWithSiret(siret: string) {
    const sirenEstablishmentDto = await getSirenEstablishmentFromApi(
      { siret, includeClosedEstablishments: false },
      this.sirenGateway,
    ).catch(async (error) => {
      if (error instanceof NotFoundError) {
        await this.establishmentAggregateRepository.updateEstablishment({
          siret,
          updatedAt: this.timeGateway.now(),
          isActive: false,
        });
        return;
      }
      throw error;
    });
    if (!sirenEstablishmentDto) return;

    const { nafDto, numberEmployeesRange, businessAddress } =
      sirenEstablishmentDto;

    const positionAndAddress = await this.getPositionAndAddressIfNeeded(
      siret,
      businessAddress,
    );

    await this.establishmentAggregateRepository.updateEstablishment({
      siret,
      updatedAt: this.timeGateway.now(),
      nafDto,
      numberEmployeesRange,
      ...(positionAndAddress ? positionAndAddress : {}),
    });
  }

  private async getPositionAndAddressIfNeeded(
    siret: string,
    formattedAddress: string,
  ): Promise<AddressAndPosition | undefined> {
    const establishmentAggregate =
      await this.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );

    const hasNeverBeenUpdated =
      !establishmentAggregate?.establishment?.updatedAt;

    if (hasNeverBeenUpdated)
      return (await this.addressAPI.lookupStreetAddress(formattedAddress)).at(
        0,
      );

    const cityInAggregate = establishmentAggregate?.establishment?.address.city
      .trim()
      .toLowerCase();

    if (
      cityInAggregate &&
      formattedAddress.toLowerCase().includes(cityInAggregate)
    )
      return;

    return (await this.addressAPI.lookupStreetAddress(formattedAddress)).at(0);
  }
}
