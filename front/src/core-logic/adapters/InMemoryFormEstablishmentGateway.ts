import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import {
  FormEstablishmentDto,
  FormEstablishmentId,
} from "src/shared/FormEstablishmentDto";
import { RomeSearchMatchDto } from "src/shared/rome";
import { sleep } from "src/shared/utils";

export class InMemoryFormEstablishmentGateway
  implements FormEstablishmentGateway
{
  public async addFormEstablishment(
    immersionOffer: FormEstablishmentDto,
  ): Promise<FormEstablishmentId> {
    console.log(immersionOffer);
    await sleep(2000);
    if (immersionOffer.businessName === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
    return immersionOffer.id;
  }

  public async searchProfession(
    searchText: string,
  ): Promise<RomeSearchMatchDto[]> {
    await sleep(700);
    if (searchText === "givemeanemptylistplease") return [];
    if (searchText === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
    return [
      {
        profession: {
          description:
            "Agent(e) chargé(e) protection, sauvegarde patrimoine naturel",
          romeCodeMetier: "A1204",
        },
        matchRanges: [{ startIndexInclusive: 9, endIndexExclusive: 13 }],
      },
      {
        profession: {
          description: "Boulanger",
          romeCodeMetier: "A1111",
        },
        matchRanges: [
          { startIndexInclusive: 0, endIndexExclusive: 3 },
          { startIndexInclusive: 5, endIndexExclusive: 8 },
        ],
      },
      {
        profession: {
          description: "Boucher",
          romeCodeMetier: "B2222",
        },
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 3 }],
      },
      {
        profession: {
          romeCodeMetier: "C3333",
          description: "Menuisier",
        },
        matchRanges: [],
      },
      {
        profession: {
          romeCodeMetier: "D4444",
          description: "Vendeur",
        },
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 7 }],
      },
    ];
  }
}
