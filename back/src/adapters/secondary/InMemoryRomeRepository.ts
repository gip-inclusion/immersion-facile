import {
  RomeAppellation,
  RomeRepository,
  RomeMetier,
} from "../../domain/rome/ports/RomeRepository";
import { RomeCodeAppellationDto, RomeCodeMetierDto } from "../../shared/rome";
import { createLogger } from "../../utils/logger";
import { normalize } from "../../utils/textSearch";

const logger = createLogger(__filename);

const metiers: RomeMetier[] = [
  {
    codeMetier: "A1203",
    libelle: "Aménagement et entretien des espaces verts",
  },
  { codeMetier: "A1409", libelle: "Élevage de lapins et volailles" },
  { codeMetier: "D1102", libelle: "Boulangerie - viennoiserie" },
  { codeMetier: "D1103", libelle: "Charcuterie - traiteur" },
  { codeMetier: "D1106", libelle: "Vente en alimentation" },
  {
    codeMetier: "D1201",
    libelle: "Achat vente d'objets d'art, anciens ou d'occasion",
  },
  { codeMetier: "D1202", libelle: "Coiffure" },
  { codeMetier: "D1505", libelle: "Personnel de caisse" },
  { codeMetier: "D1507", libelle: "Mise en rayon libre-service" },
  { codeMetier: "N4301", libelle: "Conduite sur rails" },
];

const appellations: RomeAppellation[] = [
  {
    codeAppellation: "12694",
    libelle: "Coiffeur / Coiffeuse mixte",
    codeMetier: "D1202",
  },
  {
    codeAppellation: "14704",
    libelle: "Éleveur / Éleveuse de lapins angoras",
    codeMetier: "A1409",
  },
  {
    codeAppellation: "16067",
    libelle: "Jardinier / Jardinière",
    codeMetier: "A1203",
  },
  {
    codeAppellation: "20560",
    libelle: "Vendeur / Vendeuse en boulangerie-pâtisserie",
    codeMetier: "D1106",
  },
  {
    codeAppellation: "20567",
    libelle: "Vendeur / Vendeuse en chocolaterie",
    codeMetier: "D1106",
  },
  { codeAppellation: "20714", libelle: "Vitrailliste", codeMetier: "B1602" },
];

const appellationsToRome: Array<{
  codeAppellation: RomeCodeAppellationDto;
  rome: RomeCodeMetierDto;
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
    romeCodeAppellation: RomeCodeAppellationDto,
  ): Promise<RomeCodeMetierDto | undefined> {
    return appellationsToRome.find(
      (x) => x.codeAppellation == romeCodeAppellation,
    )?.rome;
  }

  public async searchMetier(query: string): Promise<RomeMetier[]> {
    logger.info({ query }, "searchMetier");
    const normalizedQuery = normalize(query);
    return metiers.filter(
      (metier) => normalize(metier.libelle).indexOf(normalizedQuery) >= 0,
    );
  }

  public async searchAppellation(query: string): Promise<RomeAppellation[]> {
    logger.info({ query }, "searchAppellation");
    const normalizedQuery = normalize(query);
    return appellations.filter(
      (appellation) =>
        normalize(appellation.libelle).indexOf(normalizedQuery) >= 0,
    );
  }
}
