declare namespace Express {
  type JwtPayloads = import("shared").JwtPayloads;
  type ApiConsumer =
    import("../../domain/core/valueObjects/ApiConsumer").ApiConsumer;
  export interface Request {
    payloads?: JwtPayloads;
    apiConsumer?: ApiConsumer;
  }
}
