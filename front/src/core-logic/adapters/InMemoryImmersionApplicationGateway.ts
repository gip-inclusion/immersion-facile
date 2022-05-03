import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { AgencyId, AgencyInListDto } from "src/shared/agency/agency.dto";
import { signApplicationDtoWithRole } from "src/shared/ImmersionApplication/immersionApplication";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  UpdateImmersionApplicationStatusRequestDto,
  WithImmersionApplicationId,
} from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import { ShareLinkByEmailDTO } from "src/shared/ShareLinkByEmailDTO";
import { MagicLinkPayload, Role } from "src/shared/tokens/MagicLinkPayload";
import { sleep } from "src/shared/utils";

export class InMemoryImmersionApplicationGateway
  implements ImmersionApplicationGateway
{
  public constructor(private simulatedLatency?: number) {}

  public async add(
    immersionApplication: ImmersionApplicationDto,
  ): Promise<ImmersionApplicationId> {
    //eslint-disable-next-line no-console
    console.log(
      "InMemoryImmersionApplicationGateway.add: ",
      immersionApplication,
    );
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._immersionApplications[immersionApplication.id] = immersionApplication;
    return immersionApplication.id;
  }

  public async backofficeGet(
    id: ImmersionApplicationId,
  ): Promise<ImmersionApplicationDto> {
    //eslint-disable-next-line no-console
    console.log("InMemoryImmersionApplicationGateway.get: ", id);
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    return this._immersionApplications[id];
  }

  // Same as GET above, but using a magic link
  public async getMagicLink(jwt: string): Promise<ImmersionApplicationDto> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));

    const payload = decodeJwt<MagicLinkPayload>(jwt);
    return this._immersionApplications[payload.applicationId];
  }

  public async getAll(
    agency?: AgencyId,
    status?: ApplicationStatus,
  ): Promise<Array<ImmersionApplicationDto>> {
    //eslint-disable-next-line no-console
    console.log("InMemoryImmersionApplicationGateway.getAll: ", agency, status);
    this.simulatedLatency && (await sleep(this.simulatedLatency));

    return Object.values(this._immersionApplications)
      .filter((application) => !agency || application.agencyId === agency)
      .filter((application) => !status || application.status === status);
  }

  public async update(
    immersionApplication: ImmersionApplicationDto,
  ): Promise<ImmersionApplicationId> {
    //eslint-disable-next-line no-console
    console.log(
      "InMemoryImmersionApplicationGateway.update: ",
      immersionApplication,
    );
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._immersionApplications[immersionApplication.id] = immersionApplication;
    return immersionApplication.id;
  }

  public async updateMagicLink(
    immersionApplication: ImmersionApplicationDto,
    jwt: string,
  ): Promise<string> {
    //eslint-disable-next-line no-console
    console.log(
      "InMemoryImmersionApplicationGateway.updateML: ",
      immersionApplication,
    );
    const payload = decodeJwt<MagicLinkPayload>(jwt);

    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._immersionApplications[payload.applicationId] = immersionApplication;
    return immersionApplication.id;
  }

  public async updateStatus(
    { status, justification: _ }: UpdateImmersionApplicationStatusRequestDto,
    jwt: string,
  ): Promise<WithImmersionApplicationId> {
    const payload = decodeJwt<MagicLinkPayload>(jwt);
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._immersionApplications[payload.applicationId] = {
      ...this._immersionApplications[payload.applicationId],
      status,
    };
    return { id: payload.applicationId };
  }

  public async signApplication(
    jwt: string,
  ): Promise<WithImmersionApplicationId> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    const payload = decodeJwt<MagicLinkPayload>(jwt);
    const application = this._immersionApplications[payload.applicationId];
    this._immersionApplications[payload.applicationId] =
      signApplicationDtoWithRole(application, payload.role);
    return { id: payload.applicationId };
  }

  public async validate(id: ImmersionApplicationId): Promise<string> {
    //eslint-disable-next-line no-console
    console.log("InMemoryImmersionApplicationGateway.validate: ", id);
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    const form = { ...this._immersionApplications[id] };
    if (form.status === "IN_REVIEW") {
      form.status = "VALIDATED";
      this._immersionApplications[id] = form;
    } else {
      throw new Error("400 Bad Request");
    }
    return id;
  }

  public async generateMagicLink(
    _applicationId: ImmersionApplicationId,
    _role: Role,
  ): Promise<string> {
    // TODO: generate actual JWTs here
    throw new Error("500 Not Implemented In InMemory Gateway");
  }

  public async renewMagicLink(
    _expiredJwt: string,
    _linkFormat: string,
  ): Promise<void> {
    // This is supposed to ask the backend to send a new email to the owner of the expired magic link.
    // Since this operation makes no sense for local development, the implementation here is left empty.
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    throw new Error("500 Not Implemented In InMemory Gateway");
  }

  async shareLinkByEmail(
    shareLinkByEmailDTO: ShareLinkByEmailDTO,
  ): Promise<boolean> {
    //eslint-disable-next-line no-console
    console.log(
      "InMemoryImmersionApplicationGateway.shareLinkByEmail",
      shareLinkByEmailDTO,
    );

    return true;
  }

  private _immersionApplications: { [id: string]: ImmersionApplicationDto } =
    {};
  private _agencies: { [id: string]: AgencyInListDto } = {};
}
