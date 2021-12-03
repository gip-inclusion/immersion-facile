// // eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Express {
  type MagicLinkPayload =
    import("../../shared/tokens/MagicLinkPayload").MagicLinkPayload;
  type ApiConsumer = import("../../shared/tokens/ApiConsumer").ApiConsumer;

  export interface Request {
    jwtPayload: MagicLinkPayload;
    apiConsumer?: ApiConsumer;
  }
}
