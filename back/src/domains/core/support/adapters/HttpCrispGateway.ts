import { HttpClient } from "shared-routes";
import {
  CrispGateway,
  InitiateCrispConversationParams,
} from "../ports/CrispGateway";
import { CrispHeaders, CrispRoutes } from "./crispRoutes";

export type CrispConfig = {
  id: string;
  key: string;
  websiteId: string;
};

export const crispError = (params: {
  status: number;
  body: { reason: string; data: Record<string, any> };
}) =>
  new Error(
    `Crisp Api ${params.status} error, ${params.body.reason} : ${JSON.stringify(
      params.body.data,
      null,
      2,
    )}`,
  );

export class HttpCrispGateway implements CrispGateway {
  #httpClient: HttpClient<CrispRoutes>;
  #headers: CrispHeaders;
  #websiteId: string;

  constructor(httpClient: HttpClient<CrispRoutes>, crispConfig: CrispConfig) {
    const Authorization = `Basic ${Buffer.from(
      `${crispConfig.id}:${crispConfig.key}`,
    ).toString("base64")}`;

    this.#headers = {
      "X-Crisp-Tier": "plugin",
      "Content-Type": "application/json",
      Authorization,
    };
    this.#httpClient = httpClient;
    this.#websiteId = crispConfig.websiteId;
  }

  public async initiateConversation(params: InitiateCrispConversationParams) {
    const createConversationResponse =
      await this.#httpClient.createConversation({
        headers: this.#headers,
        urlParams: { websiteId: this.#websiteId },
      });

    if (createConversationResponse.status !== 201)
      throw crispError(createConversationResponse);

    const sessionId = createConversationResponse.body.data.session_id;

    const addMessageResponse = await this.#httpClient.addMessageToConversation({
      headers: this.#headers,
      body: {
        type: "text",
        from: "user",
        origin: "urn:tally",
        content: `Message : ${params.message}`,
      },
      urlParams: { sessionId, websiteId: this.#websiteId },
    });
    if (addMessageResponse.status !== 202) throw crispError(addMessageResponse);

    const addMetaResponse = await this.#httpClient.addMetadataToConversation({
      headers: this.#headers,
      body: { ...params.metadata, nickname: params.metadata.email },
      urlParams: { sessionId, websiteId: this.#websiteId },
    });
    if (addMetaResponse.status !== 200) throw crispError(addMetaResponse);

    const addNoteResponse = await this.#httpClient.addMessageToConversation({
      headers: this.#headers,
      body: {
        type: "note",
        from: "user",
        origin: "urn:tally",
        content: params.helperNote,
      },
      urlParams: { sessionId, websiteId: this.#websiteId },
    });
    if (addNoteResponse.status !== 202) throw crispError(addNoteResponse);
  }
}
