import { SearchParams } from "../ports/ImmersionOfferRepository";
import { EstablishmentsGateway } from "../ports/EstablishmentsGateway";
import {
  GetPosition,
  GetExtraEstablishmentInfos,
} from "../entities/UncompleteEstablishmentEntity";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";
import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";
import { v4 as uuidV4 } from "uuid";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";

export class UpdateEstablishmentsAndImmersionOffersFromLastSearches {
  constructor(
    private laBonneBoiteGateway: EstablishmentsGateway,
    private laPlateFormeDeLinclusionGateway: EstablishmentsGateway,
    private getPosition: GetPosition,
    private getExtraEstablishmentInfos: GetExtraEstablishmentInfos,
    private immersionOfferRepository: ImmersionOfferRepository,
  ) {}

  public async execute() {
    //We first take all searches made in the past
    const searchesMade =
      await this.immersionOfferRepository.markPendingResearchesAsProcessedAndRetrieveThem();

    //For all these searches, we go to check if we have potential immersions in our available databases

    await Promise.all(
      searchesMade.map(async (searchMade) => {
        const establishmentsLaPlateFormeDeLinclusion =
          await this.laPlateFormeDeLinclusionGateway.getEstablishments(
            searchMade,
          );

        const establishmentsLaBonneBoite =
          await this.laBonneBoiteGateway.getEstablishments(searchMade);

        const allEstablishments: EstablishmentEntity[] = await Promise.all(
          establishmentsLaPlateFormeDeLinclusion
            .concat(establishmentsLaBonneBoite)
            .map(
              async (uncompleteEstablishmentEntity) =>
                await uncompleteEstablishmentEntity.searchForMissingFields(
                  this.getPosition,
                  this.getExtraEstablishmentInfos,
                ),
            ),
        );
        //We insert the establishments in the database
        await this.immersionOfferRepository.insertEstablishments(
          allEstablishments,
        );

        //We then transform  dfffdthem into immersions and add them to our database
        const allImmersions = allEstablishments.flatMap((establishment) =>
          this.extractImmersionsFromEstablishment(establishment),
        );
        await this.immersionOfferRepository.insertImmersions(allImmersions);
      }),
    );
  }

  private extractImmersionsFromEstablishment(
    establishment: EstablishmentEntity,
  ): ImmersionOfferEntity[] {
    const romeArray = establishment.getRomeCodesArray();
    return romeArray.map(
      (rome) =>
        new ImmersionOfferEntity({
          id: uuidV4(),
          rome: rome,
          naf: establishment.getNaf(),
          siret: establishment.getSiret(),
          name: establishment.getName(),
          voluntary_to_immersion: false,
          data_source: establishment.getDataSource(),
          contact_in_establishment: undefined,
          score: establishment.getScore(),
        }),
    );
  }
}
