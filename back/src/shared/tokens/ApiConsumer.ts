export type ApiConsumer = {
  id: string;
  name: "passeEmploi";
  iat: number; //< issued at : number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  exp: number; //< expired at : number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
};
