declare namespace Express {
  type JwtPayloads = import("shared/src/tokens/MagicLinkPayload").JwtPayloads;
  type ApiConsumer =
    import("../../domain/core/valueObjects/ApiConsumer").ApiConsumer;
  export interface Request {
    payloads?: JwtPayloads;
    apiConsumer?: ApiConsumer;
  }
}
