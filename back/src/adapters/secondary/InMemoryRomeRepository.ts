import { AppellationCode, AppellationDto, RomeCode, RomeDto } from "shared";
import { RomeRepository } from "../../domain/rome/ports/RomeRepository";
import { createLogger } from "../../utils/logger";
import { normalize } from "../../utils/textSearch";

const logger = createLogger(__filename);

const romeDtos: RomeDto[] = [
  {
    romeCode: "A1203",
    romeLabel: "Aménagement et entretien des espaces verts",
  },
  { romeCode: "A1409", romeLabel: "Élevage de lapins et volailles" },
  { romeCode: "D1102", romeLabel: "Boulangerie - viennoiserie" },
  { romeCode: "D1103", romeLabel: "Charcuterie - traiteur" },
  { romeCode: "D1106", romeLabel: "Vente en alimentation" },
  {
    romeCode: "D1201",
    romeLabel: "Achat vente d'objets d'art, anciens ou d'occasion",
  },
  { romeCode: "D1202", romeLabel: "Coiffure" },
  { romeCode: "D1505", romeLabel: "Personnel de caisse" },
  { romeCode: "D1507", romeLabel: "Mise en rayon libre-service" },
  { romeCode: "N4301", romeLabel: "Conduite sur rails" },
];

const appellations: AppellationDto[] = [
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
];

const appellationsToRome: Array<{
  codeAppellation: AppellationCode;
  rome: RomeCode;
}> = [
  { codeAppellation: "11987", rome: "A1101" },
  { codeAppellation: "12120", rome: "B2200" },
  { codeAppellation: "12694", rome: "D1202" },
  { codeAppellation: "14704", rome: "A1409" },
  { codeAppellation: "16067", rome: "A1203" },
  { codeAppellation: "20560", rome: "D1106" },
  { codeAppellation: "20567", rome: "D1106" },
  { codeAppellation: "20714", rome: "B1602" },
];

export class InMemoryRomeRepository implements RomeRepository {
  public async appellationToCodeMetier(
    romeCodeAppellation: AppellationCode,
  ): Promise<RomeCode | undefined> {
    return appellationsToRome.find(
      (x) => x.codeAppellation == romeCodeAppellation,
    )?.rome;
  }

  public async searchRome(query: string): Promise<RomeDto[]> {
    logger.info({ query }, "searchRome");
    const normalizedQuery = normalize(query);
    return romeDtos.filter(
      (romeDto) => normalize(romeDto.romeLabel).indexOf(normalizedQuery) >= 0,
    );
  }

  public async searchAppellation(query: string): Promise<AppellationDto[]> {
    logger.info({ query }, "searchAppellation");
    const normalizedQuery = normalize(query);
    return appellations.filter(
      (appellation) =>
        normalize(appellation.appellationLabel).indexOf(normalizedQuery) >= 0,
    );
  }
}
