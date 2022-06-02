import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { AgencyId, AgencyInListDto } from "shared/src/agency/agency.dto";
import { signApplicationDtoWithRole } from "shared/src/ImmersionApplication/immersionApplication";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  UpdateImmersionApplicationStatusRequestDto,
  WithImmersionApplicationId,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { ShareLinkByEmailDTO } from "shared/src/ShareLinkByEmailDTO";
import { sleep } from "shared/src/utils";
import { Observable, Subject, from } from "rxjs";
import {
  ConventionMagicLinkPayload,
  Role,
} from "src/../../shared/src/tokens/MagicLinkPayload";

export class InMemoryImmersionApplicationGateway
  implements ImmersionApplicationGateway
{
  private _immersionApplications: { [id: string]: ImmersionApplicationDto } =
    {};
  private _agencies: { [id: string]: AgencyInListDto } = {};

  public immersionConvention$ = new Subject<
    ImmersionApplicationDto | undefined
  >();

  public constructor(private simulatedLatency?: number) {}

  retreiveFromToken(
    jwt: string,
  ): Observable<ImmersionApplicationDto | undefined> {
    return this.simulatedLatency
      ? from(this.getMagicLink(jwt))
      : this.immersionConvention$;
  }

  public async add(
    immersionApplication: ImmersionApplicationDto,
  ): Promise<ImmersionApplicationId> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._immersionApplications[immersionApplication.id] = immersionApplication;
    return immersionApplication.id;
  }

  public async backofficeGet(
    id: ImmersionApplicationId,
  ): Promise<ImmersionApplicationDto> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    return this._immersionApplications[id];
  }

  // Same as GET above, but using a magic link
  public async getMagicLink(jwt: string): Promise<ImmersionApplicationDto> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    const payload = decodeJwt<ConventionMagicLinkPayload>(jwt);
    return this._immersionApplications[payload.applicationId];
  }

  public async getAll(
    agency?: AgencyId,
    status?: ApplicationStatus,
  ): Promise<Array<ImmersionApplicationDto>> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));

    return Object.values(this._immersionApplications)
      .filter((application) => !agency || application.agencyId === agency)
      .filter((application) => !status || application.status === status);
  }

  public async update(
    immersionApplication: ImmersionApplicationDto,
  ): Promise<ImmersionApplicationId> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._immersionApplications[immersionApplication.id] = immersionApplication;
    return immersionApplication.id;
  }

  public async updateMagicLink(
    immersionApplication: ImmersionApplicationDto,
    jwt: string,
  ): Promise<string> {
    const payload = decodeJwt<ConventionMagicLinkPayload>(jwt);

    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._immersionApplications[payload.applicationId] = immersionApplication;
    return immersionApplication.id;
  }

  public async updateStatus(
    { status, justification: _ }: UpdateImmersionApplicationStatusRequestDto,
    jwt: string,
  ): Promise<WithImmersionApplicationId> {
    const payload = decodeJwt<ConventionMagicLinkPayload>(jwt);
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
    const payload = decodeJwt<ConventionMagicLinkPayload>(jwt);
    const application = this._immersionApplications[payload.applicationId];
    this._immersionApplications[payload.applicationId] =
      signApplicationDtoWithRole(application, payload.role);
    return { id: payload.applicationId };
  }

  public async validate(id: ImmersionApplicationId): Promise<string> {
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
    _shareLinkByEmailDTO: ShareLinkByEmailDTO,
  ): Promise<boolean> {
    return true;
  }
}
