export class HttpClientError extends Error {
  constructor(
    public override readonly message: string,
    public override readonly cause: Error,
    //TODO Restrict to valid HttpStatusCodeError
    public readonly httpStatusCode: number,
  ) {
    super();
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
  }
}

export class HttpClientForbiddenError extends HttpClientError {
  //public readonly httpStatusCode = 401;

  constructor(
    public override readonly message: string,
    public override readonly cause: Error, //TODO Restrict to valid HttpStatusCodeError
  ) {
    super(message, cause, 401);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
  }
}
