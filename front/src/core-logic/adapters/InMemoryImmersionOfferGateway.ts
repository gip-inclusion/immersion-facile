import { ImmersionOfferGateway } from "src/core-logic/ports/ImmersionOfferGateway";
import {
  ImmersionOfferDto,
  ImmersionOfferId,
} from "src/shared/ImmersionOfferDto";
import { RomeSearchResponseDto } from "src/shared/rome";
import { sleep } from "src/shared/utils";

export class InMemoryImmersionOfferGateway implements ImmersionOfferGateway {
  public async addImmersionOffer(
    immersionOffer: ImmersionOfferDto,
  ): Promise<ImmersionOfferId> {
    await sleep(2000);
    if (immersionOffer.businessName === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
    return immersionOffer.id;
  }

  public async searchProfession(
    searchText: string,
  ): Promise<RomeSearchResponseDto> {
    await sleep(700);
    return [
      {
        romeCodeMetier: "A1111",
        description: "Boulanger",
        matchRanges: [
          { startIndexInclusive: 0, endIndexExclusive: 3 },
          { startIndexInclusive: 5, endIndexExclusive: 8 },
        ],
      },
      {
        romeCodeMetier: "B2222",
        description: "Boucher",
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 3 }],
      },
      {
        romeCodeMetier: "C3333",
        description: "Menuisier",
        matchRanges: [],
      },
      {
        romeCodeMetier: "D4444",
        description: "Vendeur",
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 7 }],
      },
    ];
  }
}
