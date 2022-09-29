declare namespace Express {
  type JwtPayloads = import("shared").JwtPayloads;
  type ApiConsumer = import("shared").ApiConsumer;
  export interface Request {
    payloads?: JwtPayloads;
    apiConsumer?: ApiConsumer;
  }
}
