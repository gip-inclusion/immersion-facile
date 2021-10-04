export type RomeMetier = {
  codeMetier: string;
  libelle: string;
};

export type RomeAppellation = {
  codeAppellation: string;
  libelle: string;
};

export interface RomeGateway {
  searchMetier: (query: string) => Promise<RomeMetier[]>;
  searchAppellation: (query: string) => Promise<RomeAppellation[]>;
}
