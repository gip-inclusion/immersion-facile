import type {
  HandlerCreator,
  HandlerParams,
  HttpResponse,
} from "../createHttpClient";

type Call = {
  targetName: string;
  callParams: HandlerParams;
};

export const createInMemoryHandlerCreator = () => {
  const calls: Call[] = [];
  let response: HttpResponse<unknown> = {
    status: 201,
    responseBody: undefined,
  };
  const setResponse = <T>(newResponse: HttpResponse<T>): void => {
    response = newResponse;
  };

  const handlerCreator: HandlerCreator =
    (target) =>
    (params = {}) => {
      calls.push({
        callParams: params,
        targetName: `${target.method} ${target.url}`,
      });
      return Promise.resolve(response);
    };

  return {
    calls,
    setResponse,
    handlerCreator,
  };
};
