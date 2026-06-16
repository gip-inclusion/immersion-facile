import type { WithSiretDto } from "../siret/siret";

type WithEstablishmentBannishmentJustification = {
  establishmentBannishmentJustification: string;
};

export type BanEstablishmentPayload = WithSiretDto &
  WithEstablishmentBannishmentJustification;

export type WithBannedEstablishmentInformations =
  | { isEstablishmentBanned: false }
  | ({
      isEstablishmentBanned: true;
    } & WithEstablishmentBannishmentJustification);
