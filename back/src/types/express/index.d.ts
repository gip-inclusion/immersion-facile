// // eslint-disable-next-line @typescript-eslint/no-namespace

declare namespace Express {
  type JwtPayloads = import("../../shared/tokens/MagicLinkPayload").JwtPayloads;
  type ApiConsumer =
    import("../../domain/core/valueObjects/ApiConsumer").ApiConsumer;
  export interface Request {
    payloads?: JwtPayloads;
    apiConsumer?: ApiConsumer;
  }
}
