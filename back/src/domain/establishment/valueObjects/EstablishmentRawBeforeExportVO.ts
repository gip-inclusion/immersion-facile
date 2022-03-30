import type { EstablishmentReadyForExportVO } from "./EstablishmentReadyForExportVO";

export type EstablishmentRawProps = {
  siret: string;
  name: string;
  customizedName: string;
  address: string;
  nafCode: string;
  numberEmployees: number;
  createdAt: string;
  isCommited: boolean;
  professions: string;
  preferredContactMethods: string;
};

export type EstablishmentRawBeforeExportProps = EstablishmentRawProps & {
  postalCode: string;
  city: string;
  region: string;
  department: string;
};

export class EstablishmentRawBeforeExportVO {
  constructor(public readonly _props: EstablishmentRawBeforeExportProps) {}

  public toEstablishmentReadyForExportVO =
    (): EstablishmentReadyForExportVO => ({
      ...this._props,
      preferredContactMethods:
        translateContactMethod[this._props.preferredContactMethods],
      isCommited: translateBoolean(this._props.isCommited),
      numberEmployees: translateNumberEmployes(this._props.numberEmployees),
    });
}

const translateBoolean = (value: boolean): string =>
  value ? "Oui" : "Non déclaré";

const translateContactMethod: Record<string, string> = {
  phone: "Téléphone",
  mail: "Email",
  in_person: "En personne",
};

const translateNumberEmployes = (value: number): string =>
  value >= 0 ? value.toString() : "Non déclaré";
