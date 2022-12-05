// this token is for test purpose :

export const fakeInclusionIdTokenWithCorrectPayload =
  "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Im5vdW5jZSIsInN1YiI6Im15LXVzZXItaWQiLCJnaXZlbl9uYW1lIjoiSm9obiIsImZhbWlseV9uYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBpbmNsdXNpb24uY29tIn0.kHy9LewhgXGVPy9rwcRea6LufhvgBb4zpcXa_H0-fEHIQk6ZhMATHL3LR1bgYqAo4IBU-cg1HYEbiOYMVPd4kg";

// JWT contains the following payload :

export const fakeInclusionPayload = {
  nonce: "nounce",
  sub: "my-user-id",
  given_name: "John",
  family_name: "Doe",
  email: "john.doe@inclusion.com",
};
