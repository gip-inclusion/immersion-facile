import {
  type ConventionStatus,
  conventionStatusesAllowedForModification,
  type SubscriberErrorFeedback,
} from "shared";

interface SubscriberErrorFeedbackProps {
  subscriberErrorFeedback: SubscriberErrorFeedback;
  conventionStatus: ConventionStatus;
}

export const SubscriberErrorFeedbackComponent = ({
  subscriberErrorFeedback,
  conventionStatus,
}: SubscriberErrorFeedbackProps): JSX.Element => {
  const { message } = subscriberErrorFeedback;

  const isConventionValidated =
    !conventionStatusesAllowedForModification.includes(conventionStatus);

  const errorMessageMap: Record<string, JSX.Element> = {
    "Aucun dossier trouvé pour les critères d'identité transmis": (
      <div>
        <p>Erreur - Le bénéficiaire n'est pas inscrit dans votre structure.</p>
        <p>
          {"->"} Si le jeune peut être inscrit dans votre structure,
          inscrivez-le, puis rediffusez la convention via Immersion Facilitée.
        </p>

        <p>
          {"->"} Si le bénéficiaire ne doit pas être inscrit chez vous
          {!isConventionValidated
            ? ", vous pouvez modifier le prescripteur pour adresser la demande de convention à une autre structure. Si vous ne savez pas à qui vous adresser, voyez avec l'agence France Travail de votre bassin. Dorénavant, avec la loi du plein emploi, toute personne peut être inscrite chez France Travail"
            : " :"}
        </p>
        {isConventionValidated && (
          <ol>
            <li>Dupliquez la convention.</li>
            <li>Modifiez le prescripteur</li>
            <li>Renvoyez la nouvelle convention en signature.</li>
            <li>Annulez l'ancienne convention.</li>
          </ol>
        )}
      </div>
    ),
    "Aucune mission locale trouvée pour le numéro de SIRET fourni": (
      <div>
        <p>
          Erreur - Aucune mission locale trouvée pour le numéro de SIRET fourni.
        </p>
        <p>{"->"} Contactez le support Immersion Facilitée.</p>
      </div>
    ),
    "L'email transmis par le partenaire ne correspond pas à l'email renseigné dans le dossier du jeune":
      (
        <div>
          <p>
            "Erreur - L'email transmis par le partenaire ne correspond pas à
            l'email renseigné dans le dossier du jeune."
          </p>

          <p>
            {"->"} Si les bonnes informations sont celles saisies dans la
            convention, modifiez les informations du candidat dans votre
            logiciel (i-milo), puis rediffusez la convention via Immersion
            Facilitée.
          </p>

          <p>
            {"->"} Si les bonnes informations sont celles saisies dans votre
            logiciel (i-milo)
            {!isConventionValidated
              ? ", modifiez les informations du candidat sur la demande de convention, et renvoyez-la en signature."
              : " :"}
          </p>
          {isConventionValidated && (
            <ol>
              <li>Dupliquez la convention.</li>
              <li>Corrigez les informations bénéficiaire.</li>
              <li>Renvoyez la nouvelle convention en signature.</li>
              <li>Annulez l'ancienne convention.</li>
            </ol>
          )}
        </div>
      ),
    "Aucun employeur trouvé pour le code renseigné": (
      <div>
        <p>
          Erreur - L'entreprise n'existe pas dans votre logiciel, ou existe avec
          un SIRET différent.
        </p>
        <p>
          {"->"} Créez l'entreprise dans votre logiciel (i-milo), avec le SIRET
          présent dans la demande de convention.
        </p>
        <p>
          Le SIRET de l'entreprise est automatiquement vérifié dès la création
          de la demande sur Immersion Facilitée, donc il ne peut pas être erroné
          ou correspondre à une entreprise fermée.
        </p>
      </div>
    ),
    "Le téléphone transmis par le partenaire ne correspond pas au téléphone renseigné dans le dossier du jeune":
      (
        <div>
          <p>
            Erreur - Le téléphone transmis par le partenaire ne correspond pas
            au téléphone renseigné dans le dossier du jeune.
          </p>

          <p>
            {"->"} Si les bonnes informations sont celles saisies dans la
            convention, modifiez les informations du candidat dans votre
            logiciel (i-milo), puis rediffusez la convention via Immersion
            Facilitée.
          </p>

          <p>
            {"->"} Si les bonnes informations sont celles saisies dans votre
            logiciel (i-milo)
            {!isConventionValidated
              ? ", modifiez les informations du candidat sur la demande de convention, et renvoyez-la en signature."
              : " :"}
          </p>
          {isConventionValidated && (
            <ol>
              <li>Dupliquez la convention.</li>
              <li>Corrigez les informations bénéficiaire.</li>
              <li>Renvoyez la nouvelle convention en signature.</li>
              <li>Annulez l'ancienne convention.</li>
            </ol>
          )}
        </div>
      ),
    "Aucun métier trouvé pour le code ROME renseigné": (
      <div>
        <p>Erreur - Aucun métier trouvé pour le code ROME renseigné.</p>
        <p>{"->"} Rediffusez la convention.</p>
      </div>
    ),
    "L'email et le téléphone transmis par le partenaires ne correspondent pas aux email et téléphone renseignés dans le dossier du jeune":
      (
        <div>
          <p>
            Erreur - L'email et le téléphone transmis par le partenaires ne
            correspondent pas aux email et téléphone renseignés dans le dossier
            du jeune.
          </p>

          <p>
            {"->"} Si les bonnes informations sont celles saisies dans la
            convention, modifiez les informations du candidat dans votre
            logiciel (i-milo), puis rediffusez la convention via Immersion
            Facilitée.
          </p>

          <p>
            {"->"} Si les bonnes informations sont celles saisies dans votre
            logiciel (i-milo)
            {!isConventionValidated
              ? ", modifiez les informations du candidat sur la demande de convention, et renvoyez-la en signature."
              : " :"}
          </p>
          {isConventionValidated && (
            <ol>
              <li>Dupliquez la convention.</li>
              <li>Corrigez les informations bénéficiaire.</li>
              <li>Renvoyez la nouvelle convention en signature.</li>
              <li>Annulez l'ancienne convention.</li>
            </ol>
          )}
        </div>
      ),
    "Plusieurs dossiers trouvés pour les critères transmis": (
      <div>
        <p>Plusieurs dossiers trouvés pour les critères transmis</p>
        <p>
          {"->"} Regroupez les informations dans un seul et même dossier, et
          supprimez les dossiers qui ne sont plus utilisés.
        </p>
        <p>{"->"} Puis rediffusez la convention.</p>
      </div>
    ),
    "Identifiant National DE non trouvé": (
      <div>
        <p>Erreur - Le bénéficiaire n'est pas inscrit dans votre structure.</p>
        <p>
          {" "}
          {"->"} Inscrivez-le dans votre structure (en Cat. 5 s'il a été radié),
          puis rediffusez la convention dans Immersion facilitée.
        </p>
      </div>
    ),
    "Identifiant National DE trouvé mais écart sur la date de naissance": (
      <div>
        <p>Erreur - La date de naissance du bénéficiaire ne concorde pas.</p>
        <p>
          {"->"} Si les bonnes informations sont celles saisies dans la
          convention, modifiez les informations du candidat dans votre logiciel
          (MAP), puis rediffusez la convention via Immersion Facilitée.
        </p>
        <p>
          {"->"} Si les bonnes informations sont celles saisies dans votre
          logiciel (MAP)
          {!isConventionValidated
            ? ", modifiez les informations du candidat sur la demande de convention, et renvoyez-la en signature."
            : " :"}
        </p>
        {isConventionValidated && (
          <ol>
            <li>Dupliquez la convention.</li>
            <li>Corrigez les informations bénéficiaire.</li>
            <li>Renvoyez la nouvelle convention en signature.</li>
            <li>Annulez l'ancienne convention.</li>
          </ol>
        )}
      </div>
    ),
    "Accord non signé pour ce type de structure d'accompagnement": (
      <div>
        <p>
          Erreur - Accord non signé pour ce type de structure d'accompagnement.
        </p>
        <p>{"->"} Contactez le support Immersion Facilitée.</p>
      </div>
    ),
  };

  return (
    errorMessageMap[message] || (
      <div>
        <p>Une erreur technique s'est produite.</p>
        <p>Voici le détail :</p>
        <p>{message}</p>
      </div>
    )
  );
};
