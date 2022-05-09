import { addDays } from "date-fns";
import { createLogger } from "../../../utils/logger";
import { Clock } from "../../core/ports/Clock";
import {
  SireneEstablishmentVO,
  SireneGateway,
} from "../../sirene/ports/SireneGateway";
import { AdresseAPI } from "../ports/AdresseAPI";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";

const SIRENE_NB_DAYS_BEFORE_REFRESH = 7;

const logger = createLogger(__filename);

export class UpdateEstablishmentsFromSireneAPI {
  constructor(
    private readonly sireneGateway: SireneGateway,
    private readonly establishmentAggregateRepository: EstablishmentAggregateRepository,
    private readonly adresseAPI: AdresseAPI,
    private readonly clock: Clock,
  ) {}

  public async execute() {
    const since = addDays(this.clock.now(), -SIRENE_NB_DAYS_BEFORE_REFRESH);
    const establishmentSiretsToUpdate =
      await this.establishmentAggregateRepository.getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince(
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
        await this.updateEstablishmentWithSiret(siret);
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
  private async updateEstablishmentWithSiret(siret: string) {
    const includeClosedEstablishments = false;
    const sireneAnswer = await this.sireneGateway.get(
      siret,
      includeClosedEstablishments,
    );

    if (!sireneAnswer || sireneAnswer.etablissements.length === 0) {
      await this.establishmentAggregateRepository.updateEstablishment(siret, {
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
    const address = sireneEstablishment.formatedAddress;

    const position = await this.adresseAPI.getPositionFromAddress(address);
    if (!position) {
      logger.warn(
        { siret, address },
        "Unable to retrieve position from API Adresse",
      );
    }
    await this.establishmentAggregateRepository.updateEstablishment(siret, {
      updatedAt: this.clock.now(),
      nafDto,
      numberEmployeesRange,
      address: position ? address : undefined,
      position,
    });
  }
}
