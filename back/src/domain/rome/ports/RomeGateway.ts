export type RomeMetier = {
  code: string;
  libelle: string;
};

export interface RomeGateway {
  searchMetier: (query: string) => Promise<RomeMetier[]>;
}
