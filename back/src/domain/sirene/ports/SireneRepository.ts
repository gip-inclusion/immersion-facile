export interface SireneRepository {
  get: (siret: string) => Promise<Object | undefined>;
}
