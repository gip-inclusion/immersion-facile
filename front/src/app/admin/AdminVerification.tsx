import React, { useEffect, useState } from "react";
import { immersionApplicationGateway } from "src/app/dependencies";
import { FormAccordion } from "src/components/admin/FormAccordion";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { ErrorMessage } from "src/components/form/ErrorMessage";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";
import { Route } from "type-route";
import { routes } from "../routes";
import { InfoMessage } from "src/components/form/InfoMessage";
import { successMessageByStatus } from "../Verification/VerificationPage";

// Temporary "final verification" page for the admin to re-verify the form.

interface AdminVerificationProps {
  route: Route<typeof routes.adminVerification>;
}

export const AdminVerification = ({ route }: AdminVerificationProps) => {
  const [form, setForm] = useState<ImmersionApplicationDto | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const id = route.params.demandeId;

  const successMessageByStatus = {
    REJECTED:
      "Succès. La décision de refuser cette immersion est bien enregistrée. Cette décision va être communiquée par mail au bénéficiaire et à l'entreprise.",
    ACCEPTED_BY_COUNSELLOR:
      "Succès. L'éligibilité de cette demande est bien enregistrée. Une notification est envoyée au responsable des validations pour qu'elle/il confirme ou non la validation de cette demande et initie la convention.",
    ACCEPTED_BY_VALIDATOR:
      "Succès. La validation de cette demande est bien enregistrée. La confirmation de cette validation va être communiquée par mail au bénéficiaire et à l'entreprise.",
    VALIDATED:
      "Succès. La confirmation de cette validation est bien envoyée par mail au bénéficiaire et à l'entreprise.",
    UNKNOWN:
      "Désolé : nous n'avons pas été en mesure d'enregistrer vos informations. Veuillez réessayer ultérieurement",
    DRAFT:
      "Succès. Cette demande de modification va être communiquée par mail au bénéficiaire et à l'entreprise",
    READY_TO_SIGN:
      "Attention! Cette demande d'immersion est à statut 'Prête à ëtre Signée', donc vous ne devriez pas encore pouvoir la visualiser. Veuillez consulter l'équipe Immérsion Facilitée",
    PARTIALLY_SIGNED:
      "Attention! Cette demande d'immersion est à statut 'Signée Partiellement', donc vous ne devriez pas encore pouvoir la visualiser. Veuillez consulter l'équipe Immérsion Facilitée",
    IN_REVIEW:
      "Attention! Cette demande d'immersion est à statut 'En cours de revue', l'opération que vous venez d'effectuer ne semble pas avoir été appliquée. Veuillez réésayer ou consulter l'équipe Immérsion Facilitée",
  };


  const validationDisabled = () => {
    return !form || form.status !== "IN_REVIEW";
  };
  useEffect(() => {
    immersionApplicationGateway
      .backofficeGet(id)
      .then((data) => {
        setForm(data);
        if (form) {
          switch (form.status) {
            case "DRAFT":
              setInfoMessage(
                "La demande n'est pas encore prête pour validation",
              );
              break;
            case "IN_REVIEW":
              setInfoMessage(null);
              break;
            case "VALIDATED":
              setInfoMessage("La demande est déjà validée");
              break;
          }
        }
      })
      .catch(setError);
  }, []);

  const sendValidationRequest = () => {
    if (!form) return;
    setSubmitting(true);


    immersionApplicationGateway
      .validate(form.id)
      .then(() => {
        setSuccessMessage(
          successMessageByStatus[form.status])

        setForm({ ...form, status: "VALIDATED" });
      })
      .catch((err: React.SetStateAction<Error | null>) => {
        setError(err);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <>
      <div>Admin Verification Page</div>
      {form && (
        <>
          {infoMessage && <InfoMessage title="Attention" text={infoMessage} />}
          <FormAccordion immersionApplication={form} />
          {!validationDisabled() && (
            <button
              className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
              type="button"
              onClick={sendValidationRequest}
              disabled={validationDisabled() || isSubmitting}
            >
              Valider et envoyer la convention
            </button>
          )}
          {successMessage && (
            <SuccessMessage title="Succès">{successMessage}</SuccessMessage>
          )}
        </>
      )}
      {error && (
        <ErrorMessage title="Erreur de serveur">{error.message}</ErrorMessage>
      )}
    </>
  );
};
