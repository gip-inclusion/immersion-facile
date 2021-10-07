// // eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Express {
  type MagicLinkPayload =
    import("../../shared/tokens/MagicLinkPayload").MagicLinkPayload;

  export interface Request {
    jwtPayload: MagicLinkPayload;
  }
}
