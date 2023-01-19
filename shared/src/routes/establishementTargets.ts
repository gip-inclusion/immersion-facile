import { createTargets, CreateTargets, Target } from "http-client";
import {
  FormEstablishmentBulk,
  FormEstablishmentDto,
} from "../formEstablishment/FormEstablishment.dto";
type WithAuthorization = {
  Authorization: string;
};

const formEstablishmentsUrl = "/form-establishments";
const formEstablishmentFromSiretUrl = "/form-establishments/:siret";
const formEstablishmentAlreadyExitsUrl = "/form-already-exists/:siret";
const requestEmailToUpdateFormUrl = "/request-email-to-update-form/:siret";

export type EstablishmentTargets = CreateTargets<{
  addFormEstablishment: Target<FormEstablishmentDto>;
  updateFormEstablishment: Target<
    FormEstablishmentDto,
    void,
    WithAuthorization
  >;
  getFormEstablishment: Target<
    void,
    void,
    WithAuthorization,
    typeof formEstablishmentFromSiretUrl
  >;
  isEstablishmentWithSiretAlreadyRegistered: Target<
    void,
    void,
    void,
    typeof formEstablishmentAlreadyExitsUrl
  >;
  requestEmailToUpdateFormRoute: Target<
    void,
    void,
    void,
    typeof requestEmailToUpdateFormUrl
  >;
  addFormEstablishmentBulk: Target<
    FormEstablishmentBulk,
    void,
    WithAuthorization
  >;
}>;

export const establishmentTargets = createTargets<EstablishmentTargets>({
  addFormEstablishment: { method: "POST", url: formEstablishmentsUrl },
  updateFormEstablishment: {
    method: "PUT",
    url: formEstablishmentsUrl,
  },
  getFormEstablishment: { method: "GET", url: formEstablishmentFromSiretUrl },
  isEstablishmentWithSiretAlreadyRegistered: {
    method: "GET",
    url: formEstablishmentAlreadyExitsUrl,
  },
  requestEmailToUpdateFormRoute: {
    method: "POST",
    url: requestEmailToUpdateFormUrl,
  },
  addFormEstablishmentBulk: {
    method: "POST",
    url: "/add-form-establishment-bulk",
  },
});
