export interface ApiAdresseGateway {
  lookupStreetAddress(query: string): Promise<string[]>;
}
