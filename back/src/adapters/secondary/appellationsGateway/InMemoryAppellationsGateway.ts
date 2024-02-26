import { AppellationAndRomeDto } from "shared";
import { AppellationsGateway } from "../../../domains/core/rome/ports/AppellationsGateway";

export class InMemoryAppellationsGateway implements AppellationsGateway {
  public async findAppellations(
    query: string,
  ): Promise<AppellationAndRomeDto[]> {
    return [
      {
        romeCode: "M1607",
        appellationCode: "19364",
        appellationLabel: "Secrétaire",
        romeLabel: "Secrétariat",
      },
      {
        romeCode: "M1607",
        appellationCode: "19367",
        appellationLabel: "Secrétaire bureautique spécialisé / spécialisée",
        romeLabel: "Secrétariat",
      },
      {
        appellationLabel: "Jardinier / Jardinière",
        appellationCode: "19368",
        romeCode: "A1203",
        romeLabel: "Entretien des espaces verts",
      },
    ].filter((appellation) => appellation.appellationLabel.includes(query));
  }
}
