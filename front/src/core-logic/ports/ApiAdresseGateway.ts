export type AddressWithCoordinates = {
  label: string;
  coordinates: {
    lat: number;
    lon: number;
  };
};

export interface ApiAdresseGateway {
  lookupStreetAddress(query: string): Promise<AddressWithCoordinates[]>;
}
