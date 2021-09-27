import { ImmersionOfferGateway } from "src/core-logic/ports/ImmersionOfferGateway";
import { RomeSearchResponseDto } from "src/shared/rome";
import { sleep } from "src/shared/utils";

export class InMemoryImmersionOfferGateway implements ImmersionOfferGateway {
  public async searchProfession(
    searchTerm: string,
  ): Promise<RomeSearchResponseDto> {
    await sleep(1000);
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
