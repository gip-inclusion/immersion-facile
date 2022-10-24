import {
  CreateEndpoints,
  createHttpClient,
  Handler,
  CreateHttpClient,
  HttpResponse,
  Target,
  TargetVerbAndUrl,
} from "./createHttpClient";
// import axios, { AxiosInstance } from "axios";

type CallParams = Parameters<Handler>[0];
type Call = {
  targetName: string;
  callParams: CallParams;
};

const createInMemoryHandlerCreator = () => {
  const calls: Call[] = [];
  let response: HttpResponse<unknown> = {
    status: 201,
    responseBody: undefined,
  };
  const setResponse = <T>(newResponse: HttpResponse<T>) => {
    response = newResponse;
  };

  return {
    calls,
    setResponse,
    handlerCreator:
      (target: TargetVerbAndUrl): Handler =>
      (params) => {
        calls.push({
          callParams: params,
          targetName: `${target.method} ${target.url}`,
        });
        return Promise.resolve(response);
      },
  };
};

// const createAxiosHandlerCreator = (axios: AxiosInstance) => {
//   const myHeaders = {
//     xhr: "machin",
//   };
//
//   return (target: UnknownTarget): Handler =>
//     async (params) => {
//       const response = await axios.request({
//         method: target.method,
//         url: target.url,
//         data: params.body,
//         params: params.queryParams,
//         headers: {
//           ...myHeaders,
//           ...params.headers,
//         },
//       });
//
//       return response.data;
//     };
// };

describe("http-client", () => {
  type Book = {
    name: string;
  };

  type MyBookEndpoints = CreateEndpoints<{
    addBook: Target<void, Book, void, { authorization: string }>;
    getBooks: Target<Book[], void, { max?: number }>;
    yolo: Target;
  }>;

  it("calls the api targets with a typed interface", async () => {
    const { handlerCreator, calls, setResponse } =
      createInMemoryHandlerCreator();

    const httpClient: CreateHttpClient<MyBookEndpoints> =
      createHttpClient<MyBookEndpoints>(handlerCreator, {
        addBook: { method: "POST", url: "https://www.truc.com" },
        getBooks: { method: "GET", url: "https://www.truc.com" },
        yolo: { method: "GET", url: "http://lala" },
      });

    const book: Book = {
      name: "La horde du contrevent",
    };

    const addBookParams = {
      body: book,
      headers: { authorization: "bob" },
    };
    const addBookResponse = await httpClient.addBook(addBookParams);

    expect(calls).toHaveLength(1);
    expectToEqual(calls[0], {
      callParams: addBookParams,
      targetName: "POST https://www.truc.com",
    });
    expect(addBookResponse.status).toBe(201);
    expect(addBookResponse.responseBody).toBeUndefined();

    const books: Book[] = [{ name: "yo le livre" }];
    setResponse({ status: 200, responseBody: books });
    const getBookParams = {
      queryParams: { max: 10 },
    };
    const getBookResponse = await httpClient.getBooks(getBookParams);

    expect(calls).toHaveLength(2);
    expectToEqual(calls[1], {
      callParams: getBookParams,
      targetName: "GET https://www.truc.com",
    });
    expect(getBookResponse.status).toBe(200);
    expectToEqual(getBookResponse.responseBody, books);
  });
});

const expectToEqual = <T>(actual: T, expected: T) => {
  expect(actual).toEqual(expected);
};
