import { ApplicationStatus } from "src/shared/ImmersionApplicationDto";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { AgencyCode } from "src/shared/agencies";
import { FeatureFlags } from "src/shared/featureFlags";
import {
  AddImmersionApplicationMLResponseDto,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  IMMERSION_APPLICATION_TEMPLATE,
  UpdateImmersionApplicationStatusRequestDto,
  UpdateImmersionApplicationStatusResponseDto,
} from "src/shared/ImmersionApplicationDto";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { Role } from "src/shared/tokens/MagicLinkPayload";
import { sleep } from "src/shared/utils";

const TEST_ESTABLISHMENTS: GetSiretResponseDto[] = [
  {
    siret: "12345678901234",
    businessName: "MA P'TITE BOITE",
    businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
    naf: {
      code: "78.3Z",
      nomenclature: "Ref2",
    },
  },
  {
    siret: "11111111111111",
    businessName: "ALAIN PROST",
    businessAddress: "CHALET SECRET 73550 MERIBEL",
  },
];

const SIMULATED_LATENCY_MS = 2000;
export class InMemoryImmersionApplicationGateway extends ImmersionApplicationGateway {
  private _demandesImmersion: { [id: string]: ImmersionApplicationDto } = {};
  private _establishments: { [siret: string]: GetSiretResponseDto } = {};

  public constructor(readonly featureFlags: FeatureFlags) {
    super();
    this.add({
      ...IMMERSION_APPLICATION_TEMPLATE,
      id: "valid_draft",
      status: "DRAFT",
      email: "DRAFT.esteban@ocon.fr",
    });
    this.add({
      ...IMMERSION_APPLICATION_TEMPLATE,
      id: "valid_in_review",
      status: "IN_REVIEW",
      email: "IN_REVIEW.esteban@ocon.fr",
    });

    TEST_ESTABLISHMENTS.forEach(
      (establishment) =>
        (this._establishments[establishment.siret] = establishment),
    );
  }

  public async add(
    demandeImmersion: ImmersionApplicationDto,
  ): Promise<ImmersionApplicationId> {
    console.log("InMemoryDemandeImmersionGateway.add: ", demandeImmersion);
    await sleep(SIMULATED_LATENCY_MS);
    this._demandesImmersion[demandeImmersion.id] = demandeImmersion;
    return demandeImmersion.id;
  }

  public async addML(
    demandeImmersionDto: ImmersionApplicationDto,
  ): Promise<AddImmersionApplicationMLResponseDto> {
    console.log("InMemoryDemandeImmersionGateway.addML: ", demandeImmersionDto);
    await sleep(SIMULATED_LATENCY_MS);

    this._demandesImmersion[demandeImmersionDto.id] = demandeImmersionDto;

    // TODO: generate actual JWTs here
    throw new Error("500 Not Implemented In InMemory Gateway");
    return { magicLinkApplicant: "", magicLinkEnterprise: "" };
  }

  public async get(
    id: ImmersionApplicationId,
  ): Promise<ImmersionApplicationDto> {
    console.log("InMemoryDemandeImmersionGateway.get: ", id);
    await sleep(SIMULATED_LATENCY_MS);
    return this._demandesImmersion[id];
  }

  // Same as GET above, but using a magic link
  public async getML(jwt: string): Promise<ImmersionApplicationDto> {
    await sleep(SIMULATED_LATENCY_MS);

    const payload = decodeJwt(jwt);
    return this._demandesImmersion[payload.applicationId];
  }

  public async getAll(
    agency?: AgencyCode,
    status?: ApplicationStatus,
  ): Promise<Array<ImmersionApplicationDto>> {
    console.log("InMemoryFormulaireGateway.getAll: ", agency, status);
    await sleep(SIMULATED_LATENCY_MS);

    return Object.values(this._demandesImmersion)
      .filter((demande) => !agency || demande.agencyCode === agency)
      .filter((demande) => !status || demande.status === status);
  }

  public async update(
    demandeImmersion: ImmersionApplicationDto,
  ): Promise<ImmersionApplicationId> {
    console.log("InMemoryDemandeImmersionGateway.update: ", demandeImmersion);
    await sleep(SIMULATED_LATENCY_MS);
    this._demandesImmersion[demandeImmersion.id] = demandeImmersion;
    return demandeImmersion.id;
  }

  public async updateML(
    demandeImmersion: ImmersionApplicationDto,
    jwt: string,
  ): Promise<string> {
    console.log("InMemoryDemandeImmersionGateway.updateML: ", demandeImmersion);
    const payload = decodeJwt(jwt);

    await sleep(SIMULATED_LATENCY_MS);
    this._demandesImmersion[payload.applicationId] = demandeImmersion;
    return demandeImmersion.id;
  }

  public async updateStatus(
    { status, justification }: UpdateImmersionApplicationStatusRequestDto,
    jwt: string,
  ): Promise<UpdateImmersionApplicationStatusResponseDto> {
    const payload = decodeJwt(jwt);
    await sleep(SIMULATED_LATENCY_MS);
    this._demandesImmersion[payload.applicationId] = {
      ...this._demandesImmersion[payload.applicationId],
      status,
    };
    return { id: payload.applicationId };
  }

  public async validate(id: ImmersionApplicationId): Promise<string> {
    console.log("InMemoryDemandeImmersionGateway.validate: ", id);
    await sleep(SIMULATED_LATENCY_MS);
    let form = { ...this._demandesImmersion[id] };
    if (form.status === "IN_REVIEW") {
      form.status = "VALIDATED";
      this._demandesImmersion[id] = form;
    } else {
      throw new Error("400 Bad Request");
    }
    return id;
  }

  public async generateMagicLink(
    applicationId: ImmersionApplicationId,
    role: Role,
  ): Promise<string> {
    // TODO: generate actual JWTs here
    throw new Error("500 Not Implemented In InMemory Gateway");
    return "";
  }

  public async getSiretInfo(siret: SiretDto): Promise<GetSiretResponseDto> {
    console.log("InMemoryDemandeImmersionGateway.getSiretInfo: " + siret);
    await sleep(SIMULATED_LATENCY_MS);

    const establishment = this._establishments[siret];
    console.log(
      "InMemoryDemandeImmersionGateway.getSiretInfo: ",
      establishment,
    );

    if (!establishment) {
      throw new Error("404 Not found");
    }

    return establishment;
  }
}
