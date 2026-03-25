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
    description: "Aucun dossier trouvé pour les critères d'identité transmis",
    solution: () => (
      <>
        <p>
          Cette erreur survient généralement lorsqu'il existe une discordance
          sur la date de naissance du bénéficiaire. Vérification préalable :
          Assurez-vous que le jeune est correctement inscrit au sein de votre
          Mission Locale.
        </p>
        <p>
          {"->"} Si le bilan a déjà été saisi, la convention est ancienne et/ou
          vous n'êtes plus en contact avec l'entreprise accueillante : <br />
          Contactez le support Immersion Facilitée en précisant l'ID de la
          convention et la date de naissance. Nos équipes corrigeront la donnée
          et diffuseront la convention dans vos applicatifs."
        </p>
        {"->"} L'immersion n'a pas encore eu lieu, vous êtes en contact avec
        l'entreprise et le bilan n'a pas encore été saisi :
        <ol>
          <li>Dupliquez la convention.</li>
          <li>Corrigez la date de naissance du bénéficiaire.</li>
          <li>Renvoyez la nouvelle convention en signature.</li>
          <li>Annulez l'ancienne convention.</li>
        </ol>
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
      "Le bénéficiaire n'est pas inscrit à France Travail OU l'adresse mail indiquée sur la convention n'est pas identique à celle du dossier France travail.",
    solution: (isConventionValidated) => (
      <>
        <p>{"-> "}Dans le cas où il n'est pas inscrit :</p>
        <p>
          {!isConventionValidated ? (
            <ul>
              <li>
                Je procède à son inscription avant validation de la convention.
              </li>
              <li>
                Je peux rediffuser la convention pour qu’elle s’installe dans
                mes applicatifs,
              </li>
              <li>
                Ou dès validation de la convention, elle s’installera
                automatiquement.
              </li>
            </ul>
          ) : (
            <ul>
              <li>Je procède à l'inscription du bénéficiaire.</li>
              <li>
                Je rediffuse la convention dans mon SI France Travail depuis
                Immersion Facilitée.
              </li>
            </ul>
          )}
        </p>
        <p>
          {"-> "}Dans le cas où l'adresse mail et / ou le téléphone sont
          différents:
        </p>
        <p>
          {!isConventionValidated ? (
            <ul>
              <li>
                Je contacte le bénéficiaire pour l'informer que je modifie
                l'adresse mail et/ou le téléphone (de préférence un portable)
                indiqués sur la convention par ceux présents dans le dossier
                France travail avant validation de la convention.
              </li>
              <li>
                Dès que la convention sera modifiée, elle s’installera dans
                votre SI et l’erreur disparaîtra de vos « conventions à vérifier
                ».
              </li>
            </ul>
          ) : (
            <p>
              Je me rends sur mon assistant Immersion Facilitée accessible
              depuis “Gestion des aides” via PCM pour forcer l’identification du
              bénéficiaire. Je suis la démarche indiquée dans la version{" "}
              <a
                href="https://poleemploi.sharepoint.com/:p:/r/sites/NAT-Mediatheque-Appropriation/_layouts/15/Doc.aspx?sourcedoc=%7B40B26A24-77FD-40B3-A083-F6805C8C0B6E%7D&file=%5B26M03_3.C%5D_CFTPro_CDDE_Identification_Beneficiaires_Immersions.SA.V1.pptx&action=edit&mobileredirect=true"
                target="_blank"
                rel="noopener noreferrer"
              >
                ici
              </a>
            </p>
          )}
        </p>
      </>
    ),
  },
  "Identifiant National DE trouvé mais écart sur la date de naissance": {
    description:
      "La date de naissance du bénéficiaire indiquée sur la convention n'est pas identique à celle du dossier France Travail.",
    solution: (isConventionValidated) => (
      <>
        {isConventionValidated ? (
          <ul>
            <li>
              Je contacte le centre d'aide d'Immersion Facilitée{" "}
              <a
                href="https://aide.immersion-facile.beta.gouv.fr/fr/"
                target="_blank"
                rel="noopener noreferrer"
              >
                ici
              </a>{" "}
              pour erreur date de naissance
            </li>
            <li>
              Je communique la date de naissance à modifier et le numéro de
              convention.
            </li>
            <li>
              Immersion Facilitée procèdera à la modification et l'installation
              de la convention dans vos applicatifs.
            </li>
          </ul>
        ) : (
          <ul>
            <li>
              Je modifie la date de naissance du bénéficiaire sur la convention
              en récupérant celle sous MAP.
            </li>
            <li>
              Dès que la convention sera modifiée, elle s’installera
              automatiquement dans votre SI et l’erreur disparaîtra de vos «
              conventions à vérifier ».
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
