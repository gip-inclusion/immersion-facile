import { LaBonneBoiteRequestParams } from "../ports/LaBonneBoiteAPI";

export type LaBonneBoiteRequestResult = {
  error: string | null;
  number0fEstablishments: number | null;
};

export type LaBonneBoiteRequestEntity = {
  requestedAt: Date;
  params: LaBonneBoiteRequestParams;
  result: LaBonneBoiteRequestResult;
};
