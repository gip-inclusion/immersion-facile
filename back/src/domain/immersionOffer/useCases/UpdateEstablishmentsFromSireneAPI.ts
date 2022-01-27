import { addDays } from "date-fns";
import { createLogger } from "../../../utils/logger";
import { Clock } from "../../core/ports/Clock";
import {
  SireneEstablishmentVO,
  SireneRepository,
} from "../../sirene/ports/SireneRepository";
import { AdresseAPI } from "../ports/AdresseAPI";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";

const SIRENE_NB_DAYS_BEFORE_REFRESH = 7;

const logger = createLogger(__filename);

export class UpdateEstablishmentsFromSireneAPI {
  constructor(
    private readonly sireneRepository: SireneRepository,
    private readonly immersionOfferRepository: ImmersionOfferRepository,
    private readonly adresseAPI: AdresseAPI,
    private readonly clock: Clock,
  ) {}

  public async execute() {
    const since = addDays(this.clock.now(), -SIRENE_NB_DAYS_BEFORE_REFRESH);
    const establishmentSiretsToUpdate =
      await this.immersionOfferRepository.getActiveEstablishmentSiretsNotUpdatedSince(
        since,
      );

    // TODO parallelize this using Promise.all once we know it works :)
    for (const siret of establishmentSiretsToUpdate) {
      try {
        await this.updateEstablishmentWithSiret(siret);
      } catch (error) {
        console.log(
          "Accountered an error when updating establishment with siret ",
          siret,
        );
      }
    }
  }
  private async updateEstablishmentWithSiret(siret: string) {
    const includeClosedEstablishments = false;
    const sireneAnswer = await this.sireneRepository.get(
      siret,
      includeClosedEstablishments,
    );

    if (!sireneAnswer || sireneAnswer.etablissements.length === 0) {
      await this.immersionOfferRepository.updateEstablishment(siret, {
        updatedAt: this.clock.now(),
        isActive: false,
      });
      return;
    }

    const sireneEstablishmentProps = sireneAnswer.etablissements[0];
    const sireneEstablishment = new SireneEstablishmentVO(
      sireneEstablishmentProps,
    );
    const naf = sireneEstablishment.naf;
    const numberEmployeesRange = sireneEstablishment.numberEmployeesRange;
    const address = sireneEstablishment.formatedAddress;

    const position = await this.adresseAPI.getPositionFromAddress(address);
    if (!position) {
      logger.warn(
        { siret, address },
        "Unable to retrieve position from API Adresse",
      );
    }
    await this.immersionOfferRepository.updateEstablishment(siret, {
      updatedAt: this.clock.now(),
      naf,
      numberEmployeesRange,
      address: position ? address : undefined,
      position,
    });
  }
}
