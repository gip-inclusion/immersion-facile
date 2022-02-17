// // eslint-disable-next-line @typescript-eslint/no-namespace

declare namespace Express {
  type MagicLinkPayload =
    import("../../shared/tokens/MagicLinkPayload").MagicLinkPayload;
  type ApiConsumer =
    import("../../domain/core/valueObjects/ApiConsumer").ApiConsumer;

  export interface Request {
    jwtPayload: MagicLinkPayload;
    apiConsumer?: ApiConsumer;
  }
}
