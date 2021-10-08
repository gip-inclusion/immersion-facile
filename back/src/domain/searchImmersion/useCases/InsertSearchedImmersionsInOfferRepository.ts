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

export class InsertSearchedImmersionsInOfferRepository {
  constructor(
    private laBonneBoiteGateway: EstablishmentsGateway,
    private laPlateFormeDeLinclusionGateway: EstablishmentsGateway,
    private getPosition: GetPosition,
    private getExtraEstablishmentInfos: GetExtraEstablishmentInfos,
    private immersionOfferRepository: ImmersionOfferRepository,
  ) {}

  public async execute(searchParams: SearchParams) {
    //We first take all searches made in the past
    const searchesMade =
      await this.immersionOfferRepository.getSearchesMadeAndNotInserted();

    //For all these searches, we go to check if we have potential immersions in our available databases
    for (const searchMade in searchesMade) {
      const establishmentsLaPlateFormeDeLinclusion =
        await this.laPlateFormeDeLinclusionGateway.getEstablishments(
          searchesMade[searchMade],
        );
      const establishmentsLaBonneBoite =
        await this.laBonneBoiteGateway.getEstablishments(
          searchesMade[searchMade],
        );
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

      //We then transform  dfffdthem into immersions and add them to our database
      const allImmersions = allEstablishments.flatMap((establishment) =>
        this.extractImmersionsFromEstablishment(establishment),
      );
      this.immersionOfferRepository.insertImmersions(allImmersions);
    }
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
