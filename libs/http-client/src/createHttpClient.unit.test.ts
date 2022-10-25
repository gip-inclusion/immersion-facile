import { createInMemoryHandlerCreator } from "./adapters/createInMemoryHandlerCreator";
import type { CreateTargets, HttpClient, Target } from "./createHttpClient";
import { createHttpClient } from "./createHttpClient";

type Book = {
  name: string;
};

type MyBookEndpoints = CreateTargets<{
  addBook: Target<void, Book, void, { authorization: string }>;
  getBooks: Target<Book[], void, { max?: number }>;
  getBook: Target<
    Book | undefined,
    void,
    void,
    void,
    "https://www.truc.com/book/:bookId"
  >;
}>;

describe("http-client", () => {
  let httpClient: HttpClient<MyBookEndpoints>;
  let inMemory: ReturnType<typeof createInMemoryHandlerCreator>;

  beforeEach(() => {
    inMemory = createInMemoryHandlerCreator();

    httpClient = createHttpClient<MyBookEndpoints>(inMemory.handlerCreator, {
      addBook: { method: "POST", url: "https://www.truc.com" },
      getBooks: { method: "GET", url: "https://www.truc.com" },
      getBook: { method: "GET", url: "https://www.truc.com/book/:bookId" },
    });
  });

  it("calls the api targets with a typed interface", async () => {
    const book: Book = {
      name: "La horde du contrevent",
    };

    const addBookParams = {
      body: book,
      headers: { authorization: "bob" },
    };
    const addBookResponse = await httpClient.addBook(addBookParams);

    expect(inMemory.calls).toHaveLength(1);
    expectToEqual(inMemory.calls[0], {
      callParams: addBookParams,
      targetName: "POST https://www.truc.com",
    });
    expect(addBookResponse.status).toBe(201);
    expect(addBookResponse.responseBody).toBeUndefined();

    const books: Book[] = [{ name: "yo le livre" }];
    inMemory.setResponse({ status: 200, responseBody: books });
    const getBookParams = {
      queryParams: { max: 10 },
    };
    const getBookResponse = await httpClient.getBooks(getBookParams);

    expect(inMemory.calls).toHaveLength(2);
    expectToEqual(inMemory.calls[1], {
      callParams: getBookParams,
      targetName: "GET https://www.truc.com",
    });
    expect(getBookResponse.status).toBe(200);
    expectToEqual(getBookResponse.responseBody, books);
  });

  it("works with route with params", async () => {
    await httpClient.getBook({
      params: { bookId: "yolo" },
    });

    expect("Type is compiling").toBeTruthy();
  });
});

const expectToEqual = <T>(actual: T, expected: T) => {
  expect(actual).toEqual(expected);
};
