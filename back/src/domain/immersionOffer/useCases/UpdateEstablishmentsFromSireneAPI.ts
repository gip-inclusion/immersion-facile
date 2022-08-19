import { addDays } from "date-fns";
import { z } from "zod";
import { createLogger } from "../../../utils/logger";
import { Clock } from "../../core/ports/Clock";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SireneGateway } from "../../sirene/ports/SireneGateway";
import { SireneEstablishmentVO } from "../../sirene/valueObjects/SireneEstablishmentVO";
import { AddressGateway } from "../ports/AddressGateway";

const SIRENE_NB_DAYS_BEFORE_REFRESH = 7;

const logger = createLogger(__filename);

export class UpdateEstablishmentsFromSireneAPI extends TransactionalUseCase<void> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly sireneGateway: SireneGateway,
    private readonly addressAPI: AddressGateway,
    private readonly clock: Clock,
  ) {
    super(uowPerformer);
  }

  inputSchema = z.void();

  public async _execute(_: void, uow: UnitOfWork) {
    const since = addDays(this.clock.now(), -SIRENE_NB_DAYS_BEFORE_REFRESH);
    const establishmentSiretsToUpdate =
      await uow.establishmentAggregateRepository.getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince(
        since,
      );

    logger.info(
      `Found ${
        establishmentSiretsToUpdate.length
      } establishment to update with siret ${establishmentSiretsToUpdate.join(
        ", ",
      )}`,
    );

    // TODO parallelize this using Promise.all once we know it works :)
    for (const siret of establishmentSiretsToUpdate) {
      try {
        logger.info(`Updating establishment with siret ${siret}...`);
        await this.updateEstablishmentWithSiret(uow, siret);
        logger.info(`Successfuly updated establishment with siret ${siret} !`);
      } catch (error) {
        logger.warn(
          "Accountered an error when updating establishment with siret :",
          siret,
          error,
        );
      }
    }
  }
  private async updateEstablishmentWithSiret(uow: UnitOfWork, siret: string) {
    const includeClosedEstablishments = false;
    const sireneAnswer = await this.sireneGateway.get(
      siret,
      includeClosedEstablishments,
    );

    if (!sireneAnswer || sireneAnswer.etablissements.length === 0) {
      await uow.establishmentAggregateRepository.updateEstablishment({
        siret,
        updatedAt: this.clock.now(),
        isActive: false,
      });
      return;
    }

    const sireneEstablishmentProps = sireneAnswer.etablissements[0];
    const sireneEstablishment = new SireneEstablishmentVO(
      sireneEstablishmentProps,
    );
    const nafDto = sireneEstablishment.nafAndNomenclature;
    const numberEmployeesRange = sireneEstablishment.numberEmployeesRange;
    const formatedAddress = sireneEstablishment.formatedAddress;

    const positionAndAddress =
      await this.addressAPI.getAddressAndPositionFromString(formatedAddress);

    if (!positionAndAddress) {
      logger.warn(
        { siret, formatedAddress },
        "Unable to retrieve position from API Address",
      );
    }

    await uow.establishmentAggregateRepository.updateEstablishment({
      siret,
      updatedAt: this.clock.now(),
      nafDto,
      numberEmployeesRange,
      address: positionAndAddress?.address,
      position: positionAndAddress?.position,
    });
  }
}
