// // eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Express {
  type MagicLinkPayload =
    import("../../domain/auth/MagicLinkPayload").MagicLinkPayload;

  export interface Request {
    jwtPayload: MagicLinkPayload;
  }
}
