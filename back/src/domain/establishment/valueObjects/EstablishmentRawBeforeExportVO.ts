import type { EstablishmentReadyForExportVO } from "./EstablishmentReadyForExportVO";

export type EstablishmentRawProps = {
  siret: string;
  name: string;
  customizedName?: string;
  address: string;
  nafCode: string;
  numberEmployeesRange: string;
  createdAt: string;
  isCommited: boolean;
  professions: string;
  preferredContactMethods: string;
  contactEmail: string;
  contactPhone: string;
};

export type EstablishmentRawBeforeExportProps = EstablishmentRawProps & {
  postalCode: string;
  city: string;
  region: string;
  department: string;
};

export type EstablishmentRawBeforeExportPropsKeys =
  keyof EstablishmentRawBeforeExportProps;

export class EstablishmentRawBeforeExportVO {
  constructor(public readonly _props: EstablishmentRawBeforeExportProps) {}

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
  phone: "Téléphone",
  mail: "Email",
  in_person: "En personne",
};
