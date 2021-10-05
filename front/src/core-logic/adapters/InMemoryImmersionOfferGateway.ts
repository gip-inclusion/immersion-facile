import { ImmersionOfferGateway } from "src/core-logic/ports/ImmersionOfferGateway";
import {
  ImmersionOfferDto,
  ImmersionOfferId,
} from "src/shared/ImmersionOfferDto";
import { ProfessionDto, RomeSearchResponseDto } from "src/shared/rome";
import { sleep } from "src/shared/utils";

export class InMemoryImmersionOfferGateway implements ImmersionOfferGateway {
  public async addImmersionOffer(
    immersionOffer: ImmersionOfferDto,
  ): Promise<ImmersionOfferId> {
    console.log(immersionOffer);
    await sleep(2000);
    if (immersionOffer.businessName === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
    return immersionOffer.id;
  }

  public async searchProfession(
    searchText: string,
  ): Promise<RomeSearchResponseDto> {
    await sleep(700);
    if (searchText === "givemeanemptylistplease") return [];
    if (searchText === "givemeanerrorplease") throw new Error("418 I'm a teapot");
    return [
      {
        profession: {
          description: "Boulanger",
          romeCodeMetier: "A1111",
        } as ProfessionDto,
        matchRanges: [
          { startIndexInclusive: 0, endIndexExclusive: 3 },
          { startIndexInclusive: 5, endIndexExclusive: 8 },
        ],
      },
      {
        profession: {
          description: "Boucher",
          romeCodeMetier: "B2222",
        } as ProfessionDto,
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 3 }],
      },
      {
        profession: {
          romeCodeMetier: "C3333",
          description: "Menuisier",
        } as ProfessionDto,
        matchRanges: [],
      },
      {
        profession: {
          romeCodeMetier: "D4444",
          description: "Vendeur",
        } as ProfessionDto,
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 7 }],
      },
    ];
  }
}
