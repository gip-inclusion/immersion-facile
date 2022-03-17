// // eslint-disable-next-line @typescript-eslint/no-namespace

declare namespace Express {
  type MagicLinkPayload =
    import("../../shared/tokens/MagicLinkPayload").MagicLinkPayload;
  type ApiConsumer =
    import("../../domain/core/valueObjects/ApiConsumer").ApiConsumer;
  type EditFormEstablishmentPayload =
    import("../../shared/tokens/MagicLinkPayload").EditFormEstablishmentPayload;
  export interface Request {
    jwtPayload?: MagicLinkPayload;
    jwtEstablishmentPayload?: EditFormEstablishmentPayload;
    apiConsumer?: ApiConsumer;
  }
}
