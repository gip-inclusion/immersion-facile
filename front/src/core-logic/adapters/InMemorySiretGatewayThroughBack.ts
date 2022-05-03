import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { sleep } from "src/shared/utils";
import { SiretGatewayThroughBack } from "../ports/SiretGatewayThroughBack";

const TEST_ESTABLISHMENTS: GetSiretResponseDto[] = [
  {
    siret: "12345678901234",
    businessName: "MA P'TITE BOITE",
    businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
    naf: {
      code: "78.3Z",
      nomenclature: "Ref2",
    },
    isOpen: true,
  },
  {
    siret: "11111111111111",
    businessName: "ALAIN PROST",
    businessAddress: "CHALET SECRET 73550 MERIBEL",
    isOpen: true,
  },
];

export class InMemorySiretGatewayThroughBack
  implements SiretGatewayThroughBack
{
  public sireneEstablishments: { [siret: SiretDto]: GetSiretResponseDto } = {};

  public constructor(private simulatedLatency?: number) {
    TEST_ESTABLISHMENTS.forEach(
      (establishment) =>
        (this.sireneEstablishments[establishment.siret] = establishment),
    );
  }

  public async getSiretInfo(siret: SiretDto): Promise<GetSiretResponseDto> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));

    const establishment = this.sireneEstablishments[siret];
    //eslint-disable-next-line no-console
    console.log(
      "InMemoryImmersionApplicationGateway.getSiretInfo returned: ",
      establishment,
    );

    if (!establishment) {
      throw new Error("404 Not found");
    }

    return establishment;
  }
}
