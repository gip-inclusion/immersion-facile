import { HttpClient, defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import {
  CrispApi,
  CrispConfig,
  InitiateCrispConversationParams,
} from "../ports/CrispApi";

type CrispHeaders = z.infer<typeof crispHeadersSchema>;
const crispHeadersSchema = z.object({
  "X-Crisp-Tier": z.literal("plugin"),
  Authorization: z.string(),
  "Content-Type": z.literal("application/json"),
});

const withErrorAndReason = {
  error: z.boolean(),
  reason: z.string(),
};

export type CrispApiRoutes = typeof crispApiRoutes;
export const crispApiRoutes = defineRoutes({
  createConversation: defineRoute({
    method: "post",
    url: "https://api.crisp.chat/v1/website/:websiteId/conversation",
    headersSchema: crispHeadersSchema,
    responses: {
      404: z.object({
        ...withErrorAndReason,
        data: z.object({
          message: z.string(),
        }),
      }),
      201: z.object({
        ...withErrorAndReason,
        data: z.object({
          session_id: z.string(),
        }),
      }),
    },
  }),
  addMessageToConversation: defineRoute({
    method: "post",
    url: "https://api.crisp.chat/v1/website/:websiteId/conversation/:sessionId/message",
    headersSchema: crispHeadersSchema,
    requestBodySchema: z.object({
      type: z.enum(["text", "note"]),
      from: z.literal("user"),
      origin: z.string(),
      content: z.string(),
    }),
    responses: {
      400: z.object({
        ...withErrorAndReason,
        data: z.object({
          message: z.string(),
        }),
      }),
      202: z.object(withErrorAndReason),
    },
  }),
  addMetadataToConversation: defineRoute({
    method: "patch",
    url: "https://api.crisp.chat/v1/website/:websiteId/conversation/:sessionId/meta",
    headersSchema: crispHeadersSchema,
    requestBodySchema: z.object({
      nickname: z.string().optional(),
      email: z.string(),
      segments: z.array(z.string()),
      subject: z.string().optional(),
    }),
    responses: {
      400: z.any(),
      200: z.object(withErrorAndReason),
    },
  }),
});

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

export class HttpCrispApi implements CrispApi {
  #httpClient: HttpClient<CrispApiRoutes>;
  #headers: CrispHeaders;
  #websiteId: string;

  constructor(
    httpClient: HttpClient<CrispApiRoutes>,
    crispConfig: CrispConfig,
  ) {
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
      body: params.metadata,
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
