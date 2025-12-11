import type { ReactNode } from "react";
import type { FunctionalBroadcastFeedbackErrorMessage } from "shared";

type BroadcastFeedbackError = {
  description: string;
  solution: (isConventionValidated?: boolean) => ReactNode;
};

export const broadcastFeedbackErrorMessageMap: Record<
  FunctionalBroadcastFeedbackErrorMessage,
  BroadcastFeedbackError
> = {
  "Aucun dossier trouvé pour les critères d'identité transmis": {
    description: "Le bénéficiaire n'est pas inscrit dans votre structure.",
    solution: (isConventionValidated) => (
      <>
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
        {!!isConventionValidated && (
          <ol>
            <li>Dupliquez la convention.</li>
            <li>Modifiez le prescripteur</li>
            <li>Renvoyez la nouvelle convention en signature.</li>
            <li>Annulez l'ancienne convention.</li>
          </ol>
        )}
      </>
    ),
  },
  "Aucune mission locale trouvée pour le numéro de SIRET fourni": {
    description:
      "Aucune mission locale trouvée pour le numéro de SIRET fourni.",
    solution: () => <p>{"->"} Contactez le support Immersion Facilitée.</p>,
  },
  "L'email transmis par le partenaire ne correspond pas à l'email renseigné dans le dossier du jeune":
    {
      description:
        "L'email transmis par le partenaire ne correspond pas à l'email renseigné dans le dossier du jeune.",
      solution: (isConventionValidated) => (
        <>
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
          {!!isConventionValidated && (
            <ol>
              <li>Dupliquez la convention.</li>
              <li>Corrigez les informations bénéficiaire.</li>
              <li>Renvoyez la nouvelle convention en signature.</li>
              <li>Annulez l'ancienne convention.</li>
            </ol>
          )}
        </>
      ),
    },
  "Aucun employeur trouvé pour le code renseigné": {
    description:
      "L'entreprise n'existe pas dans votre logiciel, ou existe avec un SIRET différent.",
    solution: () => (
      <>
        <p>
          {"->"} Créez l'entreprise dans votre logiciel (i-milo), avec le SIRET
          présent dans la demande de convention.
        </p>
        <p>
          {"->"} Rediffuser la convention dans votre SI depuis Immersion
          facilitée
        </p>
        <p>
          Le SIRET de l'entreprise est automatiquement vérifié dès la création
          de la demande sur Immersion Facilitée, donc il ne peut pas être erroné
          ou correspondre à une entreprise fermée.
        </p>
      </>
    ),
  },
  "Le téléphone transmis par le partenaire ne correspond pas au téléphone renseigné dans le dossier du jeune":
    {
      description:
        "Le téléphone transmis par le partenaire ne correspond pas au téléphone renseigné dans le dossier du jeune.",
      solution: (isConventionValidated) => (
        <>
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
          {!!isConventionValidated && (
            <ol>
              <li>Dupliquez la convention.</li>
              <li>Corrigez les informations bénéficiaire.</li>
              <li>Renvoyez la nouvelle convention en signature.</li>
              <li>Annulez l'ancienne convention.</li>
            </ol>
          )}
        </>
      ),
    },
  "Aucun métier trouvé pour le code ROME renseigné": {
    description: "Aucun métier trouvé pour le code ROME renseigné.",
    solution: () => (
      <>
        <p>{"->"} Rediffusez la convention.</p>
      </>
    ),
  },
  "L'email et le téléphone transmis par le partenaires ne correspondent pas aux email et téléphone renseignés dans le dossier du jeune":
    {
      description:
        "L'email et le téléphone transmis par le partenaires ne correspondent pas aux email et téléphone renseignés dans le dossier du jeune.",
      solution: (isConventionValidated) => (
        <>
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
        </>
      ),
    },
  "Plusieurs dossiers trouvés pour les critères transmis": {
    description: "Plusieurs dossiers trouvés pour les critères transmis.",
    solution: () => (
      <>
        <p>
          {"->"} Regroupez les informations dans un seul et même dossier, et
          supprimez les dossiers qui ne sont plus utilisés.
        </p>
        <p>{"->"} Puis rediffusez la convention.</p>
      </>
    ),
  },
  "Identifiant National DE non trouvé": {
    description:
      "Le bénéficiaire n'est pas inscrit à France travail OU l'adresse mail indiquée sur la convention n'est pas identique à celle du dossier France travail.",
    solution: (isConventionValidated) => (
      <>
        <p>{"-> "}Dans le cas ou il n'est pas inscrit :</p>
        <p>
          {!isConventionValidated ? (
            "Je procède à son inscription avant validation de la convention"
          ) : (
            <ul>
              <li>Procéder à l'inscription du bénéficiaire</li>
              <li>
                Rediffuser la convention dans votre SI depuis Immersion
                facilitée
              </li>
            </ul>
          )}
        </p>
        <p>{"-> "}Dans le cas où l'adresse mail est différente:</p>
        <p>
          {!isConventionValidated ? (
            "Je contacte le bénéficiaire pour l'informer que je modifie l'adresse mail indiquée sur la convention par celle présente dans le dossier France travail avant validation de la convention."
          ) : (
            <ul>
              <li>
                Faire modifier l'adresse mail du bénéficiaire avec son accord au
                sein de France travail
              </li>
              <li>
                Rediffuser la convention dans votre SI depuis Immersion
                facilitée
              </li>
            </ul>
          )}
        </p>
      </>
    ),
  },
  "Identifiant National DE trouvé mais écart sur la date de naissance": {
    description:
      "La date de naissance du bénéficiaire indiquée sur la convention n'est pas identique à celle du dossier France travail.",
    solution: (isConventionValidated) => (
      <>
        {isConventionValidated ? (
          <>
            <p>
              {"->"} Si la convention a été validée, il n'y a pas longtemps :
            </p>
            <ul>
              <li>Dupliquer la convention.</li>
              <li>Corriger la date de naissance du bénéficiaire.</li>
              <li>Renvoyer la nouvelle convention en signature.</li>
              <li>Attendre la validation</li>
              <li>Vérifier son intégration dans vos applicatifs.</li>
              <li>Annuler l'ancienne convention.</li>
            </ul>

            <p>{"->"} Si la convention a été validée, il y a longtemps :</p>
            <ul>
              <li>
                Contacter notre centre d'aide pour erreur date de naissance
              </li>
              <li>
                Communiquer la date de naissance à modifier et le numéro de
                convention.
              </li>
              <li>
                Nous procéderons à la modification et l'installation de la
                convention dans vos applicatifs.
              </li>
            </ul>
          </>
        ) : (
          <ul>
            <li>
              Faire modifier la date de naissance du bénéficiaire avec son
              accord au sein de France travail
            </li>
            <li>
              Rediffuser la convention dans votre SI depuis Immersion facilitée
            </li>
          </ul>
        )}
      </>
    ),
  },
  "Accord non signé pour ce type de structure d'accompagnement": {
    description: "Accord non signé pour ce type de structure d'accompagnement.",
    solution: () => (
      <>
        <p>{"->"} Contactez le support Immersion Facilitée.</p>
      </>
    ),
  },
} satisfies Record<
  FunctionalBroadcastFeedbackErrorMessage,
  BroadcastFeedbackError
>;
