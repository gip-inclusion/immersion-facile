import {
  AppellationAndRomeDto,
  AppellationCode,
  RomeCode,
  RomeDto,
  cartographeAppellationAndRome,
} from "shared";
import { normalize } from "../../../../utils/textSearch";
import { RomeRepository } from "../ports/RomeRepository";

const defaultAppellations: AppellationAndRomeDto[] = [
  {
    appellationCode: "12694",
    appellationLabel: "Coiffeur / Coiffeuse mixte",
    romeCode: "D1202",
    romeLabel: "Coiffure",
  },
  {
    appellationCode: "14704",
    appellationLabel: "Éleveur / Éleveuse de lapins angoras",
    romeCode: "A1409",
    romeLabel: "Élevage",
  },
  {
    appellationCode: "16067",
    appellationLabel: "Jardinier / Jardinière",
    romeCode: "A1203",
    romeLabel: "Jardinage",
  },
  {
    appellationCode: "20560",
    appellationLabel: "Vendeur / Vendeuse en boulangerie-pâtisserie",
    romeCode: "D1106",
    romeLabel: "Vente",
  },
  {
    appellationCode: "20567",
    appellationLabel: "Vendeur / Vendeuse en chocolaterie",
    romeCode: "D1106",
    romeLabel: "Vente",
  },
  {
    appellationCode: "20714",
    appellationLabel: "Vitrailliste",
    romeCode: "B1602",
    romeLabel: "Vitraillerie",
  },
  {
    appellationCode: "13252",
    appellationLabel: "Conducteur / Conductrice d'engins de traction sur rails",
    romeCode: "N4301",
    romeLabel: "Conduite sur rails",
  },
  {
    romeCode: "B1805",
    appellationLabel: "Styliste",
    appellationCode: "19540",
    romeLabel: "Stylisme",
  },
  cartographeAppellationAndRome,
];

const appellationCodeToLegacyRome3: Record<AppellationCode, RomeDto> = {
  "12694": {
    romeCode: "V3000",
    romeLabel: "Label V3 - Coiffeur",
  },
  "14704": { romeCode: "V3001", romeLabel: "Label V3 - Eleveur de lapin" },
  "16067": { romeCode: "V3002", romeLabel: "Label V3 - Jardinier" },
  "20560": {
    romeCode: "V3003",
    romeLabel: "Label V3 - Vendeur en boulangerie",
  },
  "20567": { romeCode: "V3004", romeLabel: "Label V3 - Vendeur de chocolat" },
  "20714": { romeCode: "V3005", romeLabel: "Label V3 - Vitrailliste" },
  "13252": { romeCode: "V3006", romeLabel: "Label V3 - Conducteur d'engins" },
  "19540": { romeCode: "V3007", romeLabel: "Label V3 - Styliste" },
  [cartographeAppellationAndRome.appellationCode]: {
    romeCode: "V3008",
    romeLabel: "Label V3 - Cartographe",
  },
};

const appellationDtoToRomeDto = ({
  romeCode,
  romeLabel,
}: AppellationAndRomeDto): RomeDto => ({
  romeCode,
  romeLabel,
});

export class InMemoryRomeRepository implements RomeRepository {
  public appellations: AppellationAndRomeDto[] = defaultAppellations;

  public async appellationToCodeMetier(
    romeCodeAppellation: AppellationCode,
  ): Promise<RomeCode | undefined> {
    return this.appellations.find(
      ({ appellationCode }) => appellationCode === romeCodeAppellation,
    )?.romeCode;
  }

  public async getAppellationAndRomeDtosFromAppellationCodes(
    codes: AppellationCode[],
  ): Promise<AppellationAndRomeDto[]> {
    return this.appellations.filter((appellationDto) =>
      codes.includes(appellationDto.appellationCode),
    );
  }

  public async searchAppellation(
    query: string,
  ): Promise<AppellationAndRomeDto[]> {
    const normalizedQuery = normalize(query);
    return this.appellations.filter((appellation) =>
      normalize(appellation.appellationLabel).includes(normalizedQuery),
    );
  }

  public async searchRome(query: string): Promise<RomeDto[]> {
    const normalizedQuery = normalize(query);
    return this.appellations
      .filter((appellationDto) =>
        normalize(appellationDto.appellationLabel).includes(normalizedQuery),
      )
      .map(appellationDtoToRomeDto);
  }

  public async getAppellationAndRomeLegacyV3(appellationCode: AppellationCode) {
    const appellationV4 = this.appellations.find(
      (appellation) => appellation.appellationCode === appellationCode,
    );
    if (!appellationV4) return;

    return {
      ...appellationV4,
      ...appellationCodeToLegacyRome3[appellationV4.appellationCode],
    };
  }
}
