import type { EstablishmentReadyForExportVO } from "./EstablishmentReadyForExportVO";

export type EstablishmentRawProps = {
  siret: string;
  name: string;
  customizedName: string;
  address: string;
  nafCode: string;
  createdAt: string;
  isCommited: boolean;
  professions: string;
  preferredContactMethods: string;
};

export type EstablishmentRawBeforeExportProps = EstablishmentRawProps & {
  region: string;
  department: string;
};

export type EstablishmentWithGeoRawBeforeExportProps =
  EstablishmentRawBeforeExportProps & {
    region: string;
    department: string;
  };

export class EstablishmentRawBeforeExportVO {
  constructor(
    public readonly _props: EstablishmentWithGeoRawBeforeExportProps,
  ) {}

  public toEstablishmentReadyForExportVO =
    (): EstablishmentReadyForExportVO => ({
      ...this._props,
      preferredContactMethods:
        translateContactMethod[this._props.preferredContactMethods],
      isCommited: translateBoolean(this._props.isCommited),
    });
}

const translateBoolean = (value: boolean): string =>
  value ? "Oui" : "Non déclaré";

const translateContactMethod: Record<string, string> = {
  ["PHONE"]: "Téléphone",
  ["EMAIL"]: "Email",
  ["IN_PERSON"]: "En personne",
};
