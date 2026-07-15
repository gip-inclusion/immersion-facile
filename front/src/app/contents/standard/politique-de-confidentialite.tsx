import type { CSSProperties } from "react";
import { SectionTitle, SubSectionTitle } from "./headings";
import type { VersionnedStandardContent } from "./textSetup";

export default {
  "2022-12-02": {
    title: "Politique de confidentialité Immersion Facilitée",
    content: () => <Version20221202PrivacyPolicyContent />,
  },
  "2025-10-20": {
    title: "Politique de confidentialité Immersion Facilitée",
    content: () => <Version20251020PrivacyPolicyContent />,
  },
  latest: {
    title: "Politique de confidentialité Immersion Facilitée",
    content: () => <LatestPrivacyPolicyContent />,
  },
} satisfies VersionnedStandardContent;

// Shared styles for the data-retention tables (the only rich tables we render).
const tableStyle: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  border: "1px solid #000",
};
const rowStyle: CSSProperties = { border: "1px solid #000" };
const headerCellStyle: CSSProperties = {
  border: "1px solid #000",
  padding: "8px",
  textAlign: "left",
  backgroundColor: "#fffacd",
};
const cellStyle: CSSProperties = {
  border: "1px solid #000",
  padding: "8px",
  verticalAlign: "top",
};

const Version20221202PrivacyPolicyContent = () => (
  <>
    <SectionTitle>Qui est responsable d’Immersion Facilitée ?</SectionTitle>
    <p>
      Immersion Facilitée est développée par le GIP Plateforme de l’inclusion
      représenté par Monsieur Arnaud Denoix, Directeur du GIP de l’inclusion.
    </p>
    <SectionTitle>Pourquoi traitons-nous ces données ?</SectionTitle>
    <p>
      Immersion Facilitée a pour objectif de faciliter les immersions
      professionnelles, celles-ci étant un levier puissant d’accompagnement à
      l’emploi.
    </p>
    <p>
      Elle peut traiter des données à caractère personnel pour les finalités
      suivantes :
      <ul>
        <li>
          Dématérialiser les procédures de conventionnement de la mise en
          situation en milieu professionnel, immersion, stage ou période
          d'observation professionnelle, ainsi que l'amélioration et la
          facilitation du parcours d'accès à l'immersion professionnelle ;
        </li>
        <li>
          Construire et développer une base entreprises immersions contenant les
          entreprises volontaires pour accueillir les personnes
        </li>
        <li>
          Faciliter des tâches des prescripteurs dans la décision et le suivi
          des bénéficiaires de la période de mise en situation en milieu
          professionnel
        </li>
        <li>
          Suivre et analyser l’analyse des données de pilotage lors des mises en
          relation et la réalisation de statistiques partagées avec les acteurs
          de l’insertion
        </li>
      </ul>
    </p>
    <SectionTitle>Quelles sont les données que nous traitons ?</SectionTitle>
    <p>
      La plateforme Immersion Facilitée peut traiter les données à caractère
      personnel suivantes :
    </p>
    <SubSectionTitle>
      Données relatives au candidat à la période de mise en situation
      professionnelle ou de mini-stage :
    </SubSectionTitle>
    <p>
      <ul>
        <li>
          Etat-civil : Nom, prénom, date de naissance de la personne
          bénéficiaire,
        </li>
        <li>
          Contact : numéro de téléphone, adresse e-mail, adresse (pour le
          mini-stage),
        </li>
        <li>
          Autres données : convention ; demande d’aide matérielle à la
          réalisation de l’immersion ; reconnaissance de travailleur handicapé ;
          informations sur les horaires de travail ; Échanges et mises en
          relation
        </li>
        <li>
          ID : le cas échéant les données d’identification « France Travail »
        </li>
      </ul>
    </p>
    <SubSectionTitle>
      Données relatives à la personne de confiance du candidat ou au
      représentant légal si nécessaire :
    </SubSectionTitle>
    <p>
      <ul>
        <li>Etat civil : Nom, prénom ;</li>
        <li>Contact : téléphone, adresse électronique.</li>
      </ul>
    </p>
    <SubSectionTitle>
      Données relatives aux tuteurs et représentants des entreprises structures
      d’accueil de l’immersion ou de mini-stage :
    </SubSectionTitle>
    <p>
      <ul>
        <li>Etat civil : Nom, prénom ;</li>
        <li>Fonctions ;</li>
        <li>
          Contact : adresse électronique, téléphone professionnel du tuteur
          et/ou du représentant
        </li>
      </ul>
    </p>
    <SubSectionTitle>
      Données relatives aux agents prescripteurs et des organismes
      d'accompagnement (Conseils départementaux, France Travail, missions
      locales, SIAE et autres organismes liés par les prescripteurs de « droit
      commun » dont la mission consiste à fournir un service à caractère social,
      socio-professionnel ou professionnel au titre de l'accompagnement dont
      bénéficie la personne engagée ou éligible dans un parcours de PMSMP ou
      conseillers d'une chambre consulaire pour un mini-stage) :
    </SubSectionTitle>
    <p>
      <ul>
        <li>Etat civil : Nom, prénom,</li>
        <li>Agence ;</li>
        <li>Contact : adresse électronique.</li>
      </ul>
    </p>
    <SubSectionTitle>Données de connexion</SubSectionTitle>
    <p>
      <ul>
        <li>Traces et logs</li>
      </ul>
    </p>
    <SectionTitle>
      Qu’est-ce qui nous autorise à traiter ces données ?
    </SectionTitle>
    <p>
      L’exécution d’une mission d’intérêt public ou relevant de l’exercice de
      l’autorité publique dont est investi le responsable de traitement au sens
      de l’article 6-1 e) du RGPD. Cette mission d’intérêt public ou relevant de
      l’exercice de l’autorité publique est précisée par l’arrêté du 13 novembre
      2024 modifié, en application des textes relatifs à la PMSMP (articles
      D.5135-2 et suivants du code du travail) et des textes relatifs aux mini
      stages de découverte professionnelle (article D.123-4 du code de
      l’éducation).
    </p>
    <SectionTitle>
      Pendant combien de temps conservons-nous ces données ?
    </SectionTitle>
    <table style={tableStyle}>
      <thead>
        <tr style={rowStyle}>
          <th style={headerCellStyle}>Types de données</th>
          <th style={headerCellStyle}>Durée de conservation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={cellStyle}>
            Données relatives au candidat de mise en situation professionnelle
          </td>
          <td rowSpan={3} style={cellStyle}>
            Si la personne concernée a signé une convention d'immersion
            professionnelle, dans un délai de 5 ans à compter de la signature de
            la convention ou de l'accord d'immersion professionnelle avec
            l'entreprise partenaire. La durée consiste en 2 ans en base active
            puis 3 en base d'archivage intermédiaire
            <br />
            <br />
            Dans les autres cas, la durée de conservation est de 2 ans à compter
            de la réponse (positive ou négative reçue par la personne) ou 1 an
            en cas d'absence de réponse.
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Données relatives à la personne de confiance du candidat
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Données relatives à l'employeur actuel du candidat
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Données relatives aux tuteurs et représentants des entreprises
            structures d'accueil de l'immersion
          </td>
          <td rowSpan={3} style={cellStyle}>
            Sous réserve des conventions conservées, dès :
            <ul style={{ margin: "0", paddingLeft: "20px" }}>
              <li>
                La fin du contrat de la personne physique mentionnée, dès lors
                qu'Immersion Facilitée en prend connaissance ;
              </li>
              <li>
                La suppression du compte de la structure (entreprise ou
                prescripteur) ;
              </li>
              <li>Après une inactivité totale de 2 ans consécutifs.</li>
            </ul>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Données relatives aux agents prescripteurs et des organismes
            d'accompagnement
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Données d'authentification</td>
        </tr>
        <tr>
          <td style={cellStyle}>Données de connexion</td>
          <td style={cellStyle}>6 mois après la collecte</td>
        </tr>
        <tr>
          <td style={cellStyle}>Cookies</td>
          <td style={cellStyle}>13 mois</td>
        </tr>
      </tbody>
    </table>
    <br />
    <SectionTitle>Quels sont vos droits ?</SectionTitle>
    <p>
      Vous disposez des droits suivants concernant vos données à caractère
      personnel :
      <ul>
        <li>Droit d’information et droit d’accès aux données ;</li>
        <li>Droit de rectification de vos données ;</li>
        <li>Droit d’opposition ;</li>
        <li>Droit à la limitation du traitement de vos données.</li>
      </ul>
    </p>
    Pour les exercer, faites-nous parvenir une demande en précisant la date et
    l’heure précise de la requête – ces éléments sont indispensables pour nous
    permettre de retrouver votre recherche – par voie électronique à l’adresse
    suivante :<a href="mailto:rgpd@inclusion.gouv.fr">rgpd@inclusion.gouv.fr</a>
    Par voie postale :
    <p>
      <br />
      GIP Plateforme de l’inclusion
      <br />6 boulevard Saint-Denis
      <br />
      75010 Paris
      <br />
      France
      <br />
    </p>
    <p>
      Puisque ce sont des droits personnels, nous ne traiterons votre demande
      que si nous sommes en mesure de vous identifier. Dans le cas où nous ne
      parvenons pas à vous identifier, nous pouvons être amenés à vous demander
      une preuve de votre identité.
    </p>
    <p>
      Pour vous aider dans votre démarche, vous trouverez un modèle de courrier
      élaboré par la CNIL ici :
      <a
        href="https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces"
        target="_blank"
        rel="noopener"
      >
        https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces
      </a>
    </p>
    <p>
      Nous nous engageons à répondre dans un délai raisonnable qui ne saurait
      dépasser 1 mois à compter de la réception de votre demande.
    </p>
    <SectionTitle>Qui va avoir accès à ces données ?</SectionTitle>
    <p>
      Le responsable de traitement s’engage à ce que les données à caractères
      personnels soient traitées par les seules personnes autorisées. Outre les
      cas autorisés par la loi, les personnes et agents habilités à accéder aux
      données et à les traités pour leurs seules missions sont :
      <ul>
        <li>
          Les agents habilités du ministère chargé de la formation
          professionnelle, notamment au sein de la Délégation générale à
          l’emploi et à la formation professionnelle et au sein de la Mission
          Apprentissage, dans le cadre de leurs missions de service public, en
          particulier s’agissant du contrôle à posteriori
        </li>
        <li>
          Les agents habilités au sein des Conseils départementaux, dans le
          cadre de leurs missions de service publics et pour les seules
          personnes suivies par eux ou par les prescripteurs liés à eux par une
          convention
        </li>
        <li>
          Les agents habilités au sein de France Travail (anciennement Pôle
          emploi), pour recevoir les données relatives aux prescriptions
          d’immersion professionnelle réalisées sur Immersion Facilitée pour
          toutes les personnes inscrites à France Travail. Ils reçoivent
          également les adresses e-mail professionnels des organismes
          accompagnateurs avec lesquels ils ont une convention
        </li>
        <li>
          Les agents habilités au sein des chambres consulaires dans le cadre de
          leurs missions et pour les personnes suivies par elles
        </li>
        <li>
          Les agents habilités au sein de l’Agence de Services de Paiement de
          l’Etat, s’agissant des bénéficiaires en contrats aidés et dans le
          cadre leurs missions
        </li>
        <li>
          Les personnes habilitées au sein du Groupement d’intérêt public « Les
          entreprises s’engagent », dans le cadre de leurs missions
        </li>
        <li>
          Les personnes habilitées au sein des missions locales, dans le cadre
          de leurs missions et pour les seules personnes suivies par elles ou
          par les prescripteurs liés à elles par un contrat. Ils reçoivent
          également les adresses e-mail professionnels des organismes
          accompagnateurs avec lesquels ils ont une convention
        </li>
        <li>
          Les personnes habilitées au sein des Cap Emploi, dans le cadre de
          leurs missions et pour les seules personnes suivies par elles ou par
          les prescripteurs liés à elles par un contrat. Ils reçoivent également
          les adresses e-mail professionnels des organismes accompagnateurs avec
          lesquels ils ont une convention
        </li>
        <li>
          Les personnes habilitées au sein des structures d’insertion par
          l’activité économique (SIAE), à l’exception des ETTI
        </li>
        <li>
          Les salariés habilités des organismes accompagnateurs pour les seuls
          candidats qu’ils suivent
        </li>
      </ul>
    </p>
    <SectionTitle>
      Quelles mesures de sécurité mettons-nous en place ?
    </SectionTitle>
    <p>
      Les mesures techniques et organisationnelles de sécurité adoptées pour
      assurer la confidentialité, l’intégrité et protéger l’accès des données
      sont notamment :
      <ul>
        <li>Stockage des mots de passe en base sont hachés</li>
        <li>Cloisonnement des données</li>
        <li>Mesures de traçabilité</li>
        <li>Gestion des habilitations</li>
        <li>Surveillance</li>
        <li>Protection contre les virus, malwares et logiciels espions</li>
        <li>Protection des réseaux</li>
        <li>Sauvegarde</li>
        <li>
          Mesures restrictives limitant l’accès physiques aux données à
          caractère personnel
        </li>
      </ul>
    </p>
    <SectionTitle>Quels sont nos sous-traitants ?</SectionTitle>
    <p>
      Certaines des données sont envoyées à des sous-traitants pour réaliser
      certaines missions. Le responsable de traitement s'est assuré de la mise
      en œuvre par ses sous-traitants de garanties adéquates et du respect de
      conditions strictes de confidentialité, d'usage et de protection des
      données.
    </p>
    <table style={tableStyle}>
      <thead>
        <tr style={rowStyle}>
          <th style={headerCellStyle}>Nom du sous-traitant</th>
          <th style={headerCellStyle}>Finalité</th>
          <th style={headerCellStyle}>Documentation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={cellStyle}>Scalingo</td>
          <td style={cellStyle}>
            Hébergement du site web, de la base de données et de Metabase
          </td>
          <td style={cellStyle}>
            <a
              href="https://scalingo.com/fr/contrat-gestion-traitements-donnees-personnelles"
              target="_blank"
              rel="noopener"
            >
              https://scalingo.com/fr/contrat-gestion-traitements-donnees-personnelles
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Crisp</td>
          <td style={cellStyle}>Chat en ligne</td>
          <td style={cellStyle}>
            <a
              href="https://crisp.chat/fr/terms/"
              target="_blank"
              rel="noopener"
            >
              https://crisp.chat/fr/terms/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Brevo</td>
          <td style={cellStyle}>Outil de mailing</td>
          <td style={cellStyle}>
            <a
              href="https://www.brevo.com/fr/legal/termsofuse/"
              target="_blank"
              rel="noopener"
            >
              https://www.brevo.com/fr/legal/termsofuse/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Google Cloud
            <br />
            OVH
            <br />
            Scaleway
          </td>
          <td style={cellStyle}>Hébergement de l'outil de mailing</td>
          <td style={cellStyle}>
            Google
            <br />
            <a
              href="https://cloud.google.com/terms/data-processing-addendum/index-20240409"
              target="_blank"
              rel="noopener"
            >
              https://cloud.google.com/terms/data-processing-addendum/index-20240409
            </a>
            <br />
            <br />
            OVH
            <br />
            <a
              href="https://us.ovhcloud.com/legal/data-processing-agreement/"
              target="_blank"
              rel="noopener"
            >
              https://us.ovhcloud.com/legal/data-processing-agreement/
            </a>
            <br />
            <br />
            Scaleway
            <br />
            <a
              href="https://www.scaleway.com/fr/contrats/"
              target="_blank"
              rel="noopener"
            >
              https://www.scaleway.com/fr/contrats/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Tally</td>
          <td style={cellStyle}>Formulaire de contact</td>
          <td style={cellStyle}>
            <a href="https://tally.so/help/gdpr" target="_blank" rel="noopener">
              https://tally.so/help/gdpr
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Google Cloud</td>
          <td style={cellStyle}>Hébergement du formulaire de Tally</td>
          <td style={cellStyle}>
            <a
              href="https://cloud.google.com/terms/data-processing-addendum/"
              target="_blank"
              rel="noopener"
            >
              https://cloud.google.com/terms/data-processing-addendum/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Sentry</td>
          <td style={cellStyle}>Gestion de bugs</td>
          <td style={cellStyle}>
            <a
              href="https://sentry.io/legal/dpa/"
              target="_blank"
              rel="noopener"
            >
              https://sentry.io/legal/dpa/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>CleverCloud</td>
          <td style={cellStyle}>Stockage des fichiers</td>
          <td style={cellStyle}>
            <a
              href="https://www.clever.cloud/fr/conditions-generales-dutilisation/accord-de-traitement-des-donnees/"
              target="_blank"
              rel="noopener"
            >
              https://www.clever.cloud/fr/conditions-generales-dutilisation/accord-de-traitement-des-donnees/
            </a>
          </td>
        </tr>
      </tbody>
    </table>
    <br />
    <p>
      Aucun transfert de données au sens de l'article 44 du RGPD n'est réalisé.
    </p>
    <SectionTitle>Cookies</SectionTitle>
    <p>
      Un cookie est un fichier déposé sur votre terminal lors de la visite d’un
      site. Il a pour but de collecter des informations relatives à votre
      navigation et de vous adresser des services adaptés à votre terminal
      (ordinateur, mobile ou tablette).
    </p>
    <p>
      En application de l’article 5-3 de la directive 2002/58/CE modifiée
      concernant le traitement des données à caractère personnel et la
      protection de la vie privée dans le secteur des communications
      électroniques, transposée à l’article 82 de la loi n°78-17 du 6 janvier
      1978 relative à l’informatique, aux fichiers et aux libertés, les traceurs
      ou cookies suivent deux régimes distincts.
    </p>
    <p>
      D’une part, les cookies strictement nécessaires au service ou ayant pour
      finalité exclusive de faciliter la communication par voie électronique
      sont dispensés de consentement préalable au titre de l’article 82 de la
      loi n°78-17 du 6 janvier 1978.
    </p>
    <p>
      D’autre part, les cookies n’étant pas strictement nécessaires au service
      ou n’ayant pas pour finalité exclusive de faciliter la communication par
      voie électronique doivent être consenti par l'utilisateur.
    </p>
    <p>
      Ce consentement de la personne concernée pour une ou plusieurs finalités
      spécifiques constitue une base légale au sens du RGPD et doit être entendu
      au sens de l’article 6-1 a).
    </p>
    La plateforme dépose des cookies tiers, notamment pour la mesure d’audience
    et le support utilisateur. À tout moment, ces cookies peuvent être activés
    ou désactivés :
    <ul>
      <li>via le bandeau cookies ou</li>
      <li>via la présente politique de confidentialité</li>
    </ul>
    <table style={tableStyle}>
      <thead>
        <tr style={rowStyle}>
          <th style={headerCellStyle}>Cookies</th>
          <th style={headerCellStyle}>Base juridique</th>
          <th style={headerCellStyle}>Finalités</th>
          <th style={headerCellStyle}>Durée</th>
          <th style={headerCellStyle}>Garanties</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={cellStyle}>Crisp</td>
          <td style={cellStyle}>Consentement</td>
          <td style={cellStyle}>Agent conversationnel</td>
          <td style={cellStyle}>
            <a
              href="https://crisp.chat/fr/privacy/"
              target="_blank"
              rel="noopener"
            >
              https://crisp.chat/fr/privacy/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Sentry</td>
          <td style={cellStyle}>Exemption de consentement</td>
          <td style={cellStyle}>Gestion des bugs et remontées des erreurs</td>
          <td style={cellStyle}>
            <a
              href="https://sentry.io/legal/dpa/"
              target="_blank"
              rel="noopener"
            >
              https://sentry.io/legal/dpa/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Métabase</td>
          <td style={cellStyle}>Consentement</td>
          <td style={cellStyle}>Outil d'analyse de données</td>
          <td style={cellStyle}>
            <a
              href="https://www.metabase.com/hosting/subprocessors/"
              target="_blank"
              rel="noopener"
            >
              https://www.metabase.com/hosting/subprocessors/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Cookie de session ou token ProConnect</td>
          <td style={cellStyle}>Intérêt légitime (article 82 LIL)</td>
          <td style={cellStyle}>Connexion et log</td>
          <td style={cellStyle} />
        </tr>
      </tbody>
    </table>
    <br />
    <p>
      Il convient d'indiquer que : Les cookies ne permettent pas de suivre la
      navigation de l’internaute sur d’autres sites. Pour aller plus loin, vous
      pouvez consulter les ﬁches proposées par la Commission Nationale de
      l'Informatique et des Libertés (CNIL) :
    </p>
    <ul>
      <li>
        <a
          href="https://www.cnil.fr/fr/cookies-traceurs-que-dit-la-loi"
          target="_blank"
          rel="noopener"
        >
          {"Cookies & traceurs : que dit la loi ?"}
        </a>
      </li>
      <li>
        <a
          href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/comment-se-proteger/maitriser-votre-navigateur"
          target="_blank"
          rel="noopener"
        >
          Cookies : les outils pour les maîtriser
        </a>
      </li>
    </ul>
  </>
);

const Version20251020PrivacyPolicyContent = () => (
  <>
    <SectionTitle>Qui est responsable d’Immersion Facilitée ?</SectionTitle>
    <p>
      Immersion Facilitée est développée par le GIP Plateforme de l’inclusion
      représenté par Monsieur Arnaud Denoix, Directeur du GIP de l’inclusion.
    </p>
    <SectionTitle>Pourquoi traitons-nous ces données ?</SectionTitle>
    <p>
      Immersion Facilitée a pour objectif de faciliter les immersions
      professionnelles, celles-ci étant un levier puissant d’accompagnement à
      l’emploi.
    </p>
    <p>
      Elle peut traiter des données à caractère personnel pour les finalités
      suivantes :
      <ul>
        <li>
          Dématérialiser les procédures de conventionnement de la mise en
          situation en milieu professionnel, immersion, stage ou période
          d'observation professionnelle, ainsi que l'amélioration et la
          facilitation du parcours d'accès à l'immersion professionnelle ;
        </li>
        <li>
          Construire et développer une base entreprises immersions contenant les
          entreprises volontaires pour accueillir les personnes
        </li>
        <li>
          Faciliter des tâches des prescripteurs dans la décision et le suivi
          des bénéficiaires de la période de mise en situation en milieu
          professionnel
        </li>
        <li>
          Suivre et analyser l’analyse des données de pilotage lors des mises en
          relation et la réalisation de statistiques partagées avec les acteurs
          de l’insertion
        </li>
      </ul>
    </p>
    <SectionTitle>Quelles sont les données que nous traitons ?</SectionTitle>
    <p>
      La plateforme Immersion Facilitée peut traiter les données à caractère
      personnel suivantes :
    </p>
    <SubSectionTitle>
      Données relatives au candidat à la période de mise en situation
      professionnelle ou de mini-stage :
    </SubSectionTitle>
    <p>
      <ul>
        <li>
          Etat-civil : Nom, prénom, date de naissance de la personne
          bénéficiaire,
        </li>
        <li>
          Contact : numéro de téléphone, adresse e-mail, adresse (pour le
          mini-stage),
        </li>
        <li>
          Autres données : convention ; demande d’aide matérielle à la
          réalisation de l’immersion ; reconnaissance de travailleur handicapé ;
          informations sur les horaires de travail ; Échanges et mises en
          relation
        </li>
        <li>
          ID : le cas échéant les données d’identification « France Travail »
        </li>
      </ul>
    </p>
    <SubSectionTitle>
      Données relatives à la personne de confiance du candidat ou au
      représentant légal si nécessaire :
    </SubSectionTitle>
    <p>
      <ul>
        <li>Etat civil : Nom, prénom ;</li>
        <li>Contact : téléphone, adresse électronique.</li>
      </ul>
    </p>
    <SubSectionTitle>
      Données relatives aux tuteurs et représentants des entreprises structures
      d’accueil de l’immersion ou de mini-stage :
    </SubSectionTitle>
    <p>
      <ul>
        <li>Etat civil : Nom, prénom ;</li>
        <li>Fonctions ;</li>
        <li>
          Contact : adresse électronique, téléphone professionnel du tuteur
          et/ou du représentant
        </li>
      </ul>
    </p>
    <SubSectionTitle>
      Données relatives aux agents prescripteurs et des organismes
      d'accompagnement (Conseils départementaux, France Travail, missions
      locales, SIAE et autres organismes liés par les prescripteurs de « droit
      commun » dont la mission consiste à fournir un service à caractère social,
      socio-professionnel ou professionnel au titre de l'accompagnement dont
      bénéficie la personne engagée ou éligible dans un parcours de PMSMP ou
      conseillers d'une chambre consulaire pour un mini-stage) :
    </SubSectionTitle>
    <p>
      <ul>
        <li>Etat civil : Nom, prénom,</li>
        <li>Agence ;</li>
        <li>Contact : adresse électronique.</li>
      </ul>
    </p>
    <SubSectionTitle>Données de connexion</SubSectionTitle>
    <p>
      <ul>
        <li>Traces et logs</li>
      </ul>
    </p>
    <SectionTitle>
      Qu’est-ce qui nous autorise à traiter ces données ?
    </SectionTitle>
    <p>
      L’exécution d’une mission d’intérêt public ou relevant de l’exercice de
      l’autorité publique dont est investi le responsable de traitement au sens
      de l’article 6-1 e) du RGPD. Cette mission d’intérêt public ou relevant de
      l’exercice de l’autorité publique est précisée par l’arrêté du 13 novembre
      2024 modifié, en application des textes relatifs à la PMSMP (articles
      D.5135-2 et suivants du code du travail) et des textes relatifs aux mini
      stages de découverte professionnelle (article D.123-4 du code de
      l’éducation).
    </p>
    <SectionTitle>
      Pendant combien de temps conservons-nous ces données ?
    </SectionTitle>
    <table style={tableStyle}>
      <thead>
        <tr style={rowStyle}>
          <th style={headerCellStyle}>Types de données</th>
          <th style={headerCellStyle}>Durée de conservation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={cellStyle}>
            Données relatives au candidat de mise en situation professionnelle
          </td>
          <td rowSpan={3} style={cellStyle}>
            Si la personne concernée a signé une convention d'immersion
            professionnelle, dans un délai de 5 ans à compter de la signature de
            la convention ou de l'accord d'immersion professionnelle avec
            l'entreprise partenaire. La durée consiste en 2 ans en base active
            puis 3 en base d'archivage intermédiaire
            <br />
            <br />
            Dans les autres cas, la durée de conservation est de 2 ans à compter
            de la réponse (positive ou négative reçue par la personne) ou 1 an
            en cas d'absence de réponse.
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Données relatives à la personne de confiance du candidat
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Données relatives à l'employeur actuel du candidat
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Données relatives aux tuteurs et représentants des entreprises
            structures d'accueil de l'immersion
          </td>
          <td rowSpan={3} style={cellStyle}>
            Sous réserve des conventions conservées, dès :
            <ul style={{ margin: "0", paddingLeft: "20px" }}>
              <li>
                La fin du contrat de la personne physique mentionnée, dès lors
                qu'Immersion Facilitée en prend connaissance ;
              </li>
              <li>
                La suppression du compte de la structure (entreprise ou
                prescripteur) ;
              </li>
              <li>Après une inactivité totale de 2 ans consécutifs.</li>
            </ul>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Données relatives aux agents prescripteurs et des organismes
            d'accompagnement
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Données d'authentification</td>
        </tr>
        <tr>
          <td style={cellStyle}>Données de connexion</td>
          <td style={cellStyle}>6 mois après la collecte</td>
        </tr>
        <tr>
          <td style={cellStyle}>Cookies</td>
          <td style={cellStyle}>13 mois</td>
        </tr>
      </tbody>
    </table>
    <br />
    <SectionTitle>Quels sont vos droits ?</SectionTitle>
    <p>
      Vous disposez des droits suivants concernant vos données à caractère
      personnel :
      <ul>
        <li>Droit d’information et droit d’accès aux données ;</li>
        <li>Droit de rectification de vos données ;</li>
        <li>Droit d’opposition ;</li>
        <li>Droit à la limitation du traitement de vos données.</li>
      </ul>
    </p>
    Pour les exercer, faites-nous parvenir une demande en précisant la date et
    l’heure précise de la requête – ces éléments sont indispensables pour nous
    permettre de retrouver votre recherche – par voie électronique à l’adresse
    suivante :<a href="mailto:rgpd@inclusion.gouv.fr">rgpd@inclusion.gouv.fr</a>
    Par voie postale :
    <p>
      <br />
      GIP Plateforme de l’inclusion
      <br />6 boulevard Saint-Denis
      <br />
      75010 Paris
      <br />
      France
      <br />
    </p>
    <p>
      Puisque ce sont des droits personnels, nous ne traiterons votre demande
      que si nous sommes en mesure de vous identifier. Dans le cas où nous ne
      parvenons pas à vous identifier, nous pouvons être amenés à vous demander
      une preuve de votre identité.
    </p>
    <p>
      Pour vous aider dans votre démarche, vous trouverez un modèle de courrier
      élaboré par la CNIL ici :
      <a
        href="https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces"
        target="_blank"
        rel="noopener"
      >
        https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces
      </a>
    </p>
    <p>
      Nous nous engageons à répondre dans un délai raisonnable qui ne saurait
      dépasser 1 mois à compter de la réception de votre demande.
    </p>
    <SectionTitle>Qui va avoir accès à ces données ?</SectionTitle>
    <p>
      Le responsable de traitement s’engage à ce que les données à caractères
      personnels soient traitées par les seules personnes autorisées. Outre les
      cas autorisés par la loi, les personnes et agents habilités à accéder aux
      données et à les traités pour leurs seules missions sont :
      <ul>
        <li>
          Les agents habilités du ministère chargé de la formation
          professionnelle, notamment au sein de la Délégation générale à
          l’emploi et à la formation professionnelle et au sein de la Mission
          Apprentissage, dans le cadre de leurs missions de service public, en
          particulier s’agissant du contrôle à posteriori
        </li>
        <li>
          Les agents habilités au sein des Conseils départementaux, dans le
          cadre de leurs missions de service publics et pour les seules
          personnes suivies par eux ou par les prescripteurs liés à eux par une
          convention
        </li>
        <li>
          Les agents habilités au sein de France Travail (anciennement Pôle
          emploi), pour recevoir les données relatives aux prescriptions
          d’immersion professionnelle réalisées sur Immersion Facilitée pour
          toutes les personnes inscrites à France Travail. Ils reçoivent
          également les adresses e-mail professionnels des organismes
          accompagnateurs avec lesquels ils ont une convention
        </li>
        <li>
          Les agents habilités au sein des chambres consulaires dans le cadre de
          leurs missions et pour les personnes suivies par elles
        </li>
        <li>
          Les agents habilités au sein de l’Agence de Services de Paiement de
          l’Etat, s’agissant des bénéficiaires en contrats aidés et dans le
          cadre leurs missions
        </li>
        <li>
          Les personnes habilitées au sein du Groupement d’intérêt public « Les
          entreprises s’engagent », dans le cadre de leurs missions
        </li>
        <li>
          Les personnes habilitées au sein des missions locales, dans le cadre
          de leurs missions et pour les seules personnes suivies par elles ou
          par les prescripteurs liés à elles par un contrat. Ils reçoivent
          également les adresses e-mail professionnels des organismes
          accompagnateurs avec lesquels ils ont une convention
        </li>
        <li>
          Les personnes habilitées au sein des Cap Emploi, dans le cadre de
          leurs missions et pour les seules personnes suivies par elles ou par
          les prescripteurs liés à elles par un contrat. Ils reçoivent également
          les adresses e-mail professionnels des organismes accompagnateurs avec
          lesquels ils ont une convention
        </li>
        <li>
          Les personnes habilitées au sein des structures d’insertion par
          l’activité économique (SIAE), à l’exception des ETTI
        </li>
        <li>
          Les salariés habilités des organismes accompagnateurs pour les seuls
          candidats qu’ils suivent
        </li>
      </ul>
    </p>
    <SectionTitle>
      Quelles mesures de sécurité mettons-nous en place ?
    </SectionTitle>
    <p>
      Les mesures techniques et organisationnelles de sécurité adoptées pour
      assurer la confidentialité, l’intégrité et protéger l’accès des données
      sont notamment :
      <ul>
        <li>Stockage des mots de passe en base sont hachés</li>
        <li>Cloisonnement des données</li>
        <li>Mesures de traçabilité</li>
        <li>Gestion des habilitations</li>
        <li>Surveillance</li>
        <li>Protection contre les virus, malwares et logiciels espions</li>
        <li>Protection des réseaux</li>
        <li>Sauvegarde</li>
        <li>
          Mesures restrictives limitant l’accès physiques aux données à
          caractère personnel
        </li>
      </ul>
    </p>
    <SectionTitle>Quels sont nos sous-traitants ?</SectionTitle>
    <p>
      Certaines des données sont envoyées à des sous-traitants pour réaliser
      certaines missions. Le responsable de traitement s'est assuré de la mise
      en œuvre par ses sous-traitants de garanties adéquates et du respect de
      conditions strictes de confidentialité, d'usage et de protection des
      données.
    </p>
    <table style={tableStyle}>
      <thead>
        <tr style={rowStyle}>
          <th style={headerCellStyle}>Nom du sous-traitant</th>
          <th style={headerCellStyle}>Finalité</th>
          <th style={headerCellStyle}>Documentation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={cellStyle}>Scalingo</td>
          <td style={cellStyle}>
            Hébergement du site web, de la base de données et de Metabase
          </td>
          <td style={cellStyle}>
            <a
              href="https://scalingo.com/fr/contrat-gestion-traitements-donnees-personnelles"
              target="_blank"
              rel="noopener"
            >
              https://scalingo.com/fr/contrat-gestion-traitements-donnees-personnelles
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Crisp</td>
          <td style={cellStyle}>Chat en ligne</td>
          <td style={cellStyle}>
            <a
              href="https://crisp.chat/fr/terms/"
              target="_blank"
              rel="noopener"
            >
              https://crisp.chat/fr/terms/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Brevo</td>
          <td style={cellStyle}>Outil de mailing</td>
          <td style={cellStyle}>
            <a
              href="https://www.brevo.com/fr/legal/termsofuse/"
              target="_blank"
              rel="noopener"
            >
              https://www.brevo.com/fr/legal/termsofuse/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Google Cloud
            <br />
            OVH
            <br />
            Scaleway
          </td>
          <td style={cellStyle}>Hébergement de l'outil de mailing</td>
          <td style={cellStyle}>
            Google
            <br />
            <a
              href="https://cloud.google.com/terms/data-processing-addendum/index-20240409"
              target="_blank"
              rel="noopener"
            >
              https://cloud.google.com/terms/data-processing-addendum/index-20240409
            </a>
            <br />
            <br />
            OVH
            <br />
            <a
              href="https://us.ovhcloud.com/legal/data-processing-agreement/"
              target="_blank"
              rel="noopener"
            >
              https://us.ovhcloud.com/legal/data-processing-agreement/
            </a>
            <br />
            <br />
            Scaleway
            <br />
            <a
              href="https://www.scaleway.com/fr/contrats/"
              target="_blank"
              rel="noopener"
            >
              https://www.scaleway.com/fr/contrats/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Tally</td>
          <td style={cellStyle}>Formulaire de contact</td>
          <td style={cellStyle}>
            <a href="https://tally.so/help/gdpr" target="_blank" rel="noopener">
              https://tally.so/help/gdpr
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Google Cloud</td>
          <td style={cellStyle}>Hébergement du formulaire de Tally</td>
          <td style={cellStyle}>
            <a
              href="https://cloud.google.com/terms/data-processing-addendum/"
              target="_blank"
              rel="noopener"
            >
              https://cloud.google.com/terms/data-processing-addendum/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Sentry</td>
          <td style={cellStyle}>Gestion de bugs</td>
          <td style={cellStyle}>
            <a
              href="https://sentry.io/legal/dpa/"
              target="_blank"
              rel="noopener"
            >
              https://sentry.io/legal/dpa/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>CleverCloud</td>
          <td style={cellStyle}>Stockage des fichiers</td>
          <td style={cellStyle}>
            <a
              href="https://www.clever.cloud/fr/conditions-generales-dutilisation/accord-de-traitement-des-donnees/"
              target="_blank"
              rel="noopener"
            >
              https://www.clever.cloud/fr/conditions-generales-dutilisation/accord-de-traitement-des-donnees/
            </a>
          </td>
        </tr>
      </tbody>
    </table>
    <br />
    <p>
      Aucun transfert de données au sens de l'article 44 du RGPD n'est réalisé.
    </p>
    <SectionTitle>Cookies</SectionTitle>
    <p>
      Un cookie est un fichier déposé sur votre terminal lors de la visite d’un
      site. Il a pour but de collecter des informations relatives à votre
      navigation et de vous adresser des services adaptés à votre terminal
      (ordinateur, mobile ou tablette).
    </p>
    <p>
      En application de l’article 5-3 de la directive 2002/58/CE modifiée
      concernant le traitement des données à caractère personnel et la
      protection de la vie privée dans le secteur des communications
      électroniques, transposée à l’article 82 de la loi n°78-17 du 6 janvier
      1978 relative à l’informatique, aux fichiers et aux libertés, les traceurs
      ou cookies suivent deux régimes distincts.
    </p>
    <p>
      D’une part, les cookies strictement nécessaires au service ou ayant pour
      finalité exclusive de faciliter la communication par voie électronique
      sont dispensés de consentement préalable au titre de l’article 82 de la
      loi n°78-17 du 6 janvier 1978.
    </p>
    <p>
      D’autre part, les cookies n’étant pas strictement nécessaires au service
      ou n’ayant pas pour finalité exclusive de faciliter la communication par
      voie électronique doivent être consenti par l'utilisateur.
    </p>
    <p>
      Ce consentement de la personne concernée pour une ou plusieurs finalités
      spécifiques constitue une base légale au sens du RGPD et doit être entendu
      au sens de l’article 6-1 a).
    </p>
    La plateforme dépose des cookies tiers, notamment pour la mesure d’audience
    et le support utilisateur. À tout moment, ces cookies peuvent être activés
    ou désactivés :
    <ul>
      <li>via le bandeau cookies ou</li>
      <li>via la présente politique de confidentialité</li>
    </ul>
    <table style={tableStyle}>
      <thead>
        <tr style={rowStyle}>
          <th style={headerCellStyle}>Cookies</th>
          <th style={headerCellStyle}>Base juridique</th>
          <th style={headerCellStyle}>Finalités</th>
          <th style={headerCellStyle}>Durée</th>
          <th style={headerCellStyle}>Garanties</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={cellStyle}>Crisp</td>
          <td style={cellStyle}>Consentement</td>
          <td style={cellStyle}>Agent conversationnel</td>
          <td style={cellStyle}>
            <a
              href="https://crisp.chat/fr/privacy/"
              target="_blank"
              rel="noopener"
            >
              https://crisp.chat/fr/privacy/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Sentry</td>
          <td style={cellStyle}>Exemption de consentement</td>
          <td style={cellStyle}>Gestion des bugs et remontées des erreurs</td>
          <td style={cellStyle}>
            <a
              href="https://sentry.io/legal/dpa/"
              target="_blank"
              rel="noopener"
            >
              https://sentry.io/legal/dpa/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Métabase</td>
          <td style={cellStyle}>Consentement</td>
          <td style={cellStyle}>Outil d'analyse de données</td>
          <td style={cellStyle}>
            <a
              href="https://www.metabase.com/hosting/subprocessors/"
              target="_blank"
              rel="noopener"
            >
              https://www.metabase.com/hosting/subprocessors/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Cookie de session ou token ProConnect</td>
          <td style={cellStyle}>Intérêt légitime (article 82 LIL)</td>
          <td style={cellStyle}>Connexion et log</td>
          <td style={cellStyle} />
        </tr>
        <tr>
          <td style={cellStyle}>Piano Analytics</td>
          <td style={cellStyle}>Exemption de consentement</td>
          <td style={cellStyle}>Mesure d'audience</td>
          <td style={cellStyle}>
            <a
              href="https://piano.io/privacy-policy/"
              target="_blank"
              rel="noopener"
            >
              https://piano.io/privacy-policy/
            </a>
          </td>
        </tr>
      </tbody>
    </table>
    <br />
    <p>
      Il convient d'indiquer que : Les cookies ne permettent pas de suivre la
      navigation de l’internaute sur d’autres sites. Pour aller plus loin, vous
      pouvez consulter les ﬁches proposées par la Commission Nationale de
      l'Informatique et des Libertés (CNIL) :
    </p>
    <ul>
      <li>
        <a
          href="https://www.cnil.fr/fr/cookies-traceurs-que-dit-la-loi"
          target="_blank"
          rel="noopener"
        >
          {"Cookies & traceurs : que dit la loi ?"}
        </a>
      </li>
      <li>
        <a
          href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/comment-se-proteger/maitriser-votre-navigateur"
          target="_blank"
          rel="noopener"
        >
          Cookies : les outils pour les maîtriser
        </a>
      </li>
    </ul>
  </>
);

const LatestPrivacyPolicyContent = () => (
  <>
    <SectionTitle>Qui est responsable d’Immersion Facilitée ?</SectionTitle>
    <p>Immersion Facilitée est développée par France Travail.</p>
    <SectionTitle>Pourquoi traitons-nous ces données ?</SectionTitle>
    <p>
      Immersion Facilitée a pour objectif de faciliter les immersions
      professionnelles, celles-ci étant un levier puissant d’accompagnement à
      l’emploi.
    </p>
    <p>
      Elle peut traiter des données à caractère personnel pour les finalités
      suivantes :
      <ul>
        <li>
          Dématérialiser les procédures de conventionnement de la mise en
          situation en milieu professionnel, immersion, stage ou période
          d'observation professionnelle, ainsi que l'amélioration et la
          facilitation du parcours d'accès à l'immersion professionnelle ;
        </li>
        <li>
          Construire et développer une base entreprises immersions contenant les
          entreprises volontaires pour accueillir les personnes
        </li>
        <li>
          Faciliter des tâches des prescripteurs dans la décision et le suivi
          des bénéficiaires de la période de mise en situation en milieu
          professionnel
        </li>
        <li>
          Suivre et analyser l’analyse des données de pilotage lors des mises en
          relation et la réalisation de statistiques partagées avec les acteurs
          de l’insertion
        </li>
      </ul>
    </p>
    <SectionTitle>Quelles sont les données que nous traitons ?</SectionTitle>
    <p>
      La plateforme Immersion Facilitée peut traiter les données à caractère
      personnel suivantes :
    </p>
    <SubSectionTitle>
      Données relatives au candidat à la période de mise en situation
      professionnelle ou de mini-stage :
    </SubSectionTitle>
    <p>
      <ul>
        <li>
          Etat-civil : Nom, prénom, date de naissance de la personne
          bénéficiaire,
        </li>
        <li>
          Contact : numéro de téléphone, adresse e-mail, adresse (pour le
          mini-stage),
        </li>
        <li>
          Autres données : convention ; demande d’aide matérielle à la
          réalisation de l’immersion ; reconnaissance de travailleur handicapé ;
          informations sur les horaires de travail ; Échanges et mises en
          relation
        </li>
        <li>
          ID : le cas échéant les données d’identification « France Travail »
        </li>
      </ul>
    </p>
    <SubSectionTitle>
      Données relatives à la personne de confiance du candidat ou au
      représentant légal si nécessaire :
    </SubSectionTitle>
    <p>
      <ul>
        <li>Etat civil : Nom, prénom ;</li>
        <li>Contact : téléphone, adresse électronique.</li>
      </ul>
    </p>
    <SubSectionTitle>
      Données relatives aux tuteurs et représentants des entreprises structures
      d’accueil de l’immersion ou de mini-stage :
    </SubSectionTitle>
    <p>
      <ul>
        <li>Etat civil : Nom, prénom ;</li>
        <li>Fonctions ;</li>
        <li>
          Contact : adresse électronique, téléphone professionnel du tuteur
          et/ou du représentant
        </li>
      </ul>
    </p>
    <SubSectionTitle>
      Données relatives aux agents prescripteurs et des organismes
      d'accompagnement (Conseils départementaux, France Travail, missions
      locales, SIAE et autres organismes liés par les prescripteurs de « droit
      commun » dont la mission consiste à fournir un service à caractère social,
      socio-professionnel ou professionnel au titre de l'accompagnement dont
      bénéficie la personne engagée ou éligible dans un parcours de PMSMP ou
      conseillers d'une chambre consulaire pour un mini-stage) :
    </SubSectionTitle>
    <p>
      <ul>
        <li>Etat civil : Nom, prénom,</li>
        <li>Agence ;</li>
        <li>Contact : adresse électronique.</li>
      </ul>
    </p>
    <SubSectionTitle>Données de connexion</SubSectionTitle>
    <p>
      <ul>
        <li>Traces et logs</li>
      </ul>
    </p>
    <SectionTitle>
      Qu’est-ce qui nous autorise à traiter ces données ?
    </SectionTitle>
    <p>
      L’exécution d’une mission d’intérêt public ou relevant de l’exercice de
      l’autorité publique dont est investi le responsable de traitement au sens
      de l’article 6-1 e) du RGPD. Cette mission d’intérêt public ou relevant de
      l’exercice de l’autorité publique est précisée par l’arrêté du 13 novembre
      2024 modifié, en application des textes relatifs à la PMSMP (articles
      D.5135-2 et suivants du code du travail) et des textes relatifs aux mini
      stages de découverte professionnelle (article D.123-4 du code de
      l’éducation).
    </p>
    <SectionTitle>
      Pendant combien de temps conservons-nous ces données ?
    </SectionTitle>
    <table style={tableStyle}>
      <thead>
        <tr style={rowStyle}>
          <th style={headerCellStyle}>Types de données</th>
          <th style={headerCellStyle}>Durée de conservation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={cellStyle}>
            Données relatives au candidat de mise en situation professionnelle
          </td>
          <td rowSpan={3} style={cellStyle}>
            Si la personne concernée a signé une convention d'immersion
            professionnelle, dans un délai de 5 ans à compter de la signature de
            la convention ou de l'accord d'immersion professionnelle avec
            l'entreprise partenaire. La durée consiste en 2 ans en base active
            puis 3 en base d'archivage intermédiaire
            <br />
            <br />
            Dans les autres cas, la durée de conservation est de 2 ans à compter
            de la réponse (positive ou négative reçue par la personne) ou 1 an
            en cas d'absence de réponse.
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Données relatives à la personne de confiance du candidat
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Données relatives à l'employeur actuel du candidat
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Données relatives aux tuteurs et représentants des entreprises
            structures d'accueil de l'immersion
          </td>
          <td rowSpan={3} style={cellStyle}>
            Sous réserve des conventions conservées, dès :
            <ul style={{ margin: "0", paddingLeft: "20px" }}>
              <li>
                La fin du contrat de la personne physique mentionnée, dès lors
                qu'Immersion Facilitée en prend connaissance ;
              </li>
              <li>
                La suppression du compte de la structure (entreprise ou
                prescripteur) ;
              </li>
              <li>Après une inactivité totale de 2 ans consécutifs.</li>
            </ul>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Données relatives aux agents prescripteurs et des organismes
            d'accompagnement
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Données d'authentification</td>
        </tr>
        <tr>
          <td style={cellStyle}>Données de connexion</td>
          <td style={cellStyle}>6 mois après la collecte</td>
        </tr>
        <tr>
          <td style={cellStyle}>Cookies</td>
          <td style={cellStyle}>13 mois</td>
        </tr>
      </tbody>
    </table>
    <br />
    <SectionTitle>Quels sont vos droits ?</SectionTitle>
    <p>
      Vous disposez des droits suivants concernant vos données à caractère
      personnel :
      <ul>
        <li>Droit d’information et droit d’accès aux données ;</li>
        <li>Droit de rectification de vos données ;</li>
        <li>Droit d’opposition ;</li>
        <li>Droit à la limitation du traitement de vos données.</li>
      </ul>
    </p>
    <p>
      Pour exercer ces droits ou pour toute question sur le traitement de vos
      données, contactez-nous à :
      <a href="mailto:contact@immersion-facile.beta.gouv.fr">
        contact@immersion-facile.beta.gouv.fr
      </a>
      .
    </p>
    <p>
      Ou, auprès du délégué à la protection des données de France Travail (1
      avenue du Docteur Gley, 75987 Paris cedex 20)
    </p>
    <p>
      Vous avez aussi le droit de porter une réclamation devant la Commission
      nationale de l’informatique et des libertés (CNIL).
    </p>
    <p>
      Puisque ce sont des droits personnels, nous ne traiterons votre demande
      que si nous sommes en mesure de vous identifier. Dans le cas où nous ne
      parvenons pas à vous identifier, nous pouvons être amenés à vous demander
      une preuve de votre identité.
    </p>
    <p>
      Pour vous aider dans votre démarche, vous trouverez un modèle de courrier
      élaboré par la CNIL ici :
      <a
        href="https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces"
        target="_blank"
        rel="noopener"
      >
        https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces
      </a>
    </p>
    <p>
      Nous nous engageons à répondre dans un délai raisonnable qui ne saurait
      dépasser 1 mois à compter de la réception de votre demande.
    </p>
    <SectionTitle>Qui va avoir accès à ces données ?</SectionTitle>
    <p>
      Le responsable de traitement s’engage à ce que les données à caractères
      personnels soient traitées par les seules personnes autorisées. Outre les
      cas autorisés par la loi, les personnes et agents habilités à accéder aux
      données et à les traités pour leurs seules missions sont :
      <ul>
        <li>
          Les agents habilités du ministère chargé de la formation
          professionnelle, notamment au sein de la Délégation générale à
          l’emploi et à la formation professionnelle et au sein de la Mission
          Apprentissage, dans le cadre de leurs missions de service public, en
          particulier s’agissant du contrôle à posteriori
        </li>
        <li>
          Les agents habilités au sein des Conseils départementaux, dans le
          cadre de leurs missions de service publics et pour les seules
          personnes suivies par eux ou par les prescripteurs liés à eux par une
          convention
        </li>
        <li>
          Les agents habilités au sein de France Travail (anciennement Pôle
          emploi), pour recevoir les données relatives aux prescriptions
          d’immersion professionnelle réalisées sur Immersion Facilitée pour
          toutes les personnes inscrites à France Travail. Ils reçoivent
          également les adresses e-mail professionnels des organismes
          accompagnateurs avec lesquels ils ont une convention
        </li>
        <li>
          Les agents habilités au sein des chambres consulaires dans le cadre de
          leurs missions et pour les personnes suivies par elles
        </li>
        <li>
          Les agents habilités au sein de l’Agence de Services de Paiement de
          l’Etat, s’agissant des bénéficiaires en contrats aidés et dans le
          cadre leurs missions
        </li>
        <li>
          Les personnes habilitées au sein du Groupement d’intérêt public « Les
          entreprises s’engagent », dans le cadre de leurs missions
        </li>
        <li>
          Les personnes habilitées au sein des missions locales, dans le cadre
          de leurs missions et pour les seules personnes suivies par elles ou
          par les prescripteurs liés à elles par un contrat. Ils reçoivent
          également les adresses e-mail professionnels des organismes
          accompagnateurs avec lesquels ils ont une convention
        </li>
        <li>
          Les personnes habilitées au sein des Cap Emploi, dans le cadre de
          leurs missions et pour les seules personnes suivies par elles ou par
          les prescripteurs liés à elles par un contrat. Ils reçoivent également
          les adresses e-mail professionnels des organismes accompagnateurs avec
          lesquels ils ont une convention
        </li>
        <li>
          Les personnes habilitées au sein des structures d’insertion par
          l’activité économique (SIAE), à l’exception des ETTI
        </li>
        <li>
          Les salariés habilités des organismes accompagnateurs pour les seuls
          candidats qu’ils suivent
        </li>
      </ul>
    </p>
    <SectionTitle>
      Quelles mesures de sécurité mettons-nous en place ?
    </SectionTitle>
    <p>
      Les mesures techniques et organisationnelles de sécurité adoptées pour
      assurer la confidentialité, l’intégrité et protéger l’accès des données
      sont notamment :
      <ul>
        <li>Stockage des mots de passe en base sont hachés</li>
        <li>Cloisonnement des données</li>
        <li>Mesures de traçabilité</li>
        <li>Gestion des habilitations</li>
        <li>Surveillance</li>
        <li>Protection contre les virus, malwares et logiciels espions</li>
        <li>Protection des réseaux</li>
        <li>Sauvegarde</li>
        <li>
          Mesures restrictives limitant l’accès physiques aux données à
          caractère personnel
        </li>
      </ul>
    </p>
    <SectionTitle>Quels sont nos sous-traitants ?</SectionTitle>
    <p>
      Certaines des données sont envoyées à des sous-traitants pour réaliser
      certaines missions. Le responsable de traitement s'est assuré de la mise
      en œuvre par ses sous-traitants de garanties adéquates et du respect de
      conditions strictes de confidentialité, d'usage et de protection des
      données.
    </p>
    <table style={tableStyle}>
      <thead>
        <tr style={rowStyle}>
          <th style={headerCellStyle}>Nom du sous-traitant</th>
          <th style={headerCellStyle}>Finalité</th>
          <th style={headerCellStyle}>Documentation</th>
          <th style={headerCellStyle}>Lieu d'hébergement</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={cellStyle}>Scalingo</td>
          <td style={cellStyle}>
            Hébergement du site web, de la base de données et de Metabase
          </td>
          <td style={cellStyle}>
            <a
              href="https://scalingo.com/fr/contrat-gestion-traitements-donnees-personnelles"
              target="_blank"
              rel="noopener"
            >
              https://scalingo.com/fr/contrat-gestion-traitements-donnees-personnelles
            </a>
          </td>
          <td style={cellStyle}>
            <a
              href="https://scalingo.com/fr/contrat-gestion-traitements-donnees-personnelles"
              target="_blank"
              rel="noopener"
            >
              Union européenne 
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Crisp</td>
          <td style={cellStyle}>Chat en ligne</td>
          <td style={cellStyle}>
            <a
              href="https://crisp.chat/fr/terms/"
              target="_blank"
              rel="noopener"
            >
              https://crisp.chat/fr/terms/
            </a>
          </td>
          <td style={cellStyle}>
            <a
              href="https://help.crisp.chat/en/article/whats-crisp-eu-gdpr-compliance-status-nhv54c/"
              target="_blank"
              rel="noopener"
            >
              Pays-Bas et Allemagne via Digital Oceans
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Brevo</td>
          <td style={cellStyle}>Outil de mailing</td>
          <td style={cellStyle}>
            <a
              href="https://www.brevo.com/fr/legal/termsofuse/"
              target="_blank"
              rel="noopener"
            >
              https://www.brevo.com/fr/legal/termsofuse/
            </a>
          </td>
          <td style={cellStyle}>
            France ou Belgique via OVH, Scaleway ou Google Cloud
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>
            Google Cloud
            <br />
            OVH
            <br />
            Scaleway
          </td>
          <td style={cellStyle}>Hébergement de l'outil de mailing</td>
          <td style={cellStyle}>
            Google
            <br />
            <a
              href="https://cloud.google.com/terms/data-processing-addendum/index-20240409"
              target="_blank"
              rel="noopener"
            >
              https://cloud.google.com/terms/data-processing-addendum/index-20240409
            </a>
            <br />
            <br />
            OVH
            <br />
            <a
              href="https://us.ovhcloud.com/legal/data-processing-agreement/"
              target="_blank"
              rel="noopener"
            >
              https://us.ovhcloud.com/legal/data-processing-agreement/
            </a>
            <br />
            <br />
            Scaleway
            <br />
            <a
              href="https://www.scaleway.com/fr/contrats/"
              target="_blank"
              rel="noopener"
            >
              https://www.scaleway.com/fr/contrats/
            </a>
          </td>
          <td style={cellStyle}>Union européenne</td>
        </tr>
        <tr>
          <td style={cellStyle}>Tally</td>
          <td style={cellStyle}>Formulaire de contact</td>
          <td style={cellStyle}>
            <a href="https://tally.so/help/gdpr" target="_blank" rel="noopener">
              https://tally.so/help/gdpr
            </a>
          </td>
          <td style={cellStyle}>
            <a href="https://tally.so/help/gdpr" target="_blank" rel="noopener">
              Belgique via Google Cloud
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Google Cloud</td>
          <td style={cellStyle}>Hébergement du formulaire de Tally</td>
          <td style={cellStyle}>
            <a
              href="https://cloud.google.com/terms/data-processing-addendum/"
              target="_blank"
              rel="noopener"
            >
              https://cloud.google.com/terms/data-processing-addendum/
            </a>
          </td>
          <td style={cellStyle}>
            <a href="https://tally.so/help/gdpr" target="_blank" rel="noopener">
              Belgique
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Sentry</td>
          <td style={cellStyle}>Gestion de bugs</td>
          <td style={cellStyle}>
            <a
              href="https://sentry.io/legal/dpa/"
              target="_blank"
              rel="noopener"
            >
              https://sentry.io/legal/dpa/
            </a>
          </td>
          <td style={cellStyle}>
            <a
              href="https://docs.sentry.io/organization/data-storage-location"
              target="_blank"
              rel="noopener"
            >
              Allemagne
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Datadog</td>
          <td style={cellStyle}>Monitoring des erreurs</td>
          <td style={cellStyle}>
            <a
              href="https://www.datadoghq.com/pdf/Datadog_GDPR_Data_Processing_Addendum_v2.0_2021.09.27.pdf"
              target="_blank"
              rel="noopener"
            >
              https://www.datadoghq.com/pdf/Datadog_GDPR_Data_Processing_Addendum_v2.0_2021.09.27.pdf
            </a>
          </td>
          <td style={cellStyle}>Allemagne</td>
        </tr>
        <tr>
          <td style={cellStyle}>CleverCloud</td>
          <td style={cellStyle}>Stockage des fichiers</td>
          <td style={cellStyle}>
            <a
              href="https://www.clever.cloud/fr/conditions-generales-dutilisation/accord-de-traitement-des-donnees/"
              target="_blank"
              rel="noopener"
            >
              https://www.clever.cloud/fr/conditions-generales-dutilisation/accord-de-traitement-des-donnees/
            </a>
          </td>
          <td style={cellStyle}>
            <a
              href="https://www.clever-cloud.com/fr/conditions-generales-dutilisation/accord-de-traitement-des-donnees/"
              target="_blank"
              rel="noopener"
            >
              France
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Piano Analytics</td>
          <td style={cellStyle}>Mesure d’audience</td>
          <td style={cellStyle}>
            <a
              href="https://piano.io/privacy-policy/"
              target="_blank"
              rel="noopener"
            >
              https://piano.io/privacy-policy/
            </a>
          </td>
          <td style={cellStyle}>
            <a
              href="https://www.piano.io/legal/privacy-policy#piano-sub-processors"
              target="_blank"
              rel="noopener"
            >
              Union européenne et États-Unis
            </a>
          </td>
        </tr>
      </tbody>
    </table>
    <br />
    <p>
      A l’exception de Datadog, aucun transfert de données au sens de l’article
      44 du RGPD n’est réalisé. Datadog est un outil de vérification d’erreurs
      qui ne comporte normalement pas de données à caractère personnel. Il peut
      arriver que les rapports en contiennent de manière exceptionnelle, elles
      sont dès lors supprimées.
    </p>
    <SectionTitle>Cookies</SectionTitle>
    <p>
      Un cookie est un fichier déposé sur votre terminal lors de la visite d’un
      site. Il a pour but de collecter des informations relatives à votre
      navigation et de vous adresser des services adaptés à votre terminal
      (ordinateur, mobile ou tablette).
    </p>
    <p>
      En application de l’article 5-3 de la directive 2002/58/CE modifiée
      concernant le traitement des données à caractère personnel et la
      protection de la vie privée dans le secteur des communications
      électroniques, transposée à l’article 82 de la loi n°78-17 du 6 janvier
      1978 relative à l’informatique, aux fichiers et aux libertés, les traceurs
      ou cookies suivent deux régimes distincts.
    </p>
    <p>
      D’une part, les cookies strictement nécessaires au service ou ayant pour
      finalité exclusive de faciliter la communication par voie électronique
      sont dispensés de consentement préalable au titre de l’article 82 de la
      loi n°78-17 du 6 janvier 1978.
    </p>
    <p>
      D’autre part, les cookies n’étant pas strictement nécessaires au service
      ou n’ayant pas pour finalité exclusive de faciliter la communication par
      voie électronique doivent être consenti par l'utilisateur.
    </p>
    <p>
      Ce consentement de la personne concernée pour une ou plusieurs finalités
      spécifiques constitue une base légale au sens du RGPD et doit être entendu
      au sens de l’article 6-1 a).
    </p>
    La plateforme dépose des cookies tiers, notamment pour la mesure d’audience
    et le support utilisateur. À tout moment, ces cookies peuvent être activés
    ou désactivés :
    <ul>
      <li>via le bandeau cookies ou</li>
      <li>via la présente politique de confidentialité</li>
    </ul>
    <table style={tableStyle}>
      <thead>
        <tr style={rowStyle}>
          <th style={headerCellStyle}>Cookies</th>
          <th style={headerCellStyle}>Base juridique</th>
          <th style={headerCellStyle}>Finalités</th>
          <th style={headerCellStyle}>Durée</th>
          <th style={headerCellStyle}>Garanties</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={cellStyle}>Piano Analytics</td>
          <td style={cellStyle}>Exemption de consentement</td>
          <td style={cellStyle}>Mesure d’audience</td>
          <td rowSpan={6}>13 mois</td>
          <td style={cellStyle}>
            <a
              href="https://piano.io/privacy-policy/"
              target="_blank"
              rel="noopener"
            >
              https://piano.io/privacy-policy/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Crisp</td>
          <td style={cellStyle}>Consentement</td>
          <td style={cellStyle}>Agent conversationnel</td>
          <td style={cellStyle}>
            <a
              href="https://crisp.chat/fr/privacy/"
              target="_blank"
              rel="noopener"
            >
              https://crisp.chat/fr/privacy/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Sentry</td>
          <td style={cellStyle}>Exemption de consentement</td>
          <td style={cellStyle}>Gestion des bugs et remontées des erreurs</td>
          <td style={cellStyle}>
            <a
              href="https://sentry.io/legal/dpa/"
              target="_blank"
              rel="noopener"
            >
              https://sentry.io/legal/dpa/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Métabase</td>
          <td style={cellStyle}>Consentement</td>
          <td style={cellStyle}>Outil d'analyse de données</td>
          <td style={cellStyle}>
            <a
              href="https://www.metabase.com/hosting/subprocessors/"
              target="_blank"
              rel="noopener"
            >
              https://www.metabase.com/hosting/subprocessors/
            </a>
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>Cookie de session ou token ProConnect</td>
          <td style={cellStyle}>Intérêt légitime (article 82 LIL)</td>
          <td style={cellStyle}>Connexion et log</td>
          <td style={cellStyle} />
        </tr>
        <tr>
          <td style={cellStyle}>Piano Analytics</td>
          <td style={cellStyle}>Exemption de consentement</td>
          <td style={cellStyle}>Mesure d'audience</td>
          <td style={cellStyle}>
            <a
              href="https://piano.io/privacy-policy/"
              target="_blank"
              rel="noopener"
            >
              https://piano.io/privacy-policy/
            </a>
          </td>
        </tr>
      </tbody>
    </table>
    <br />
    <p>
      Il convient d'indiquer que : Les cookies ne permettent pas de suivre la
      navigation de l’internaute sur d’autres sites. Pour aller plus loin, vous
      pouvez consulter les ﬁches proposées par la Commission Nationale de
      l'Informatique et des Libertés (CNIL) :
    </p>
    <ul>
      <li>
        <a
          href="https://www.cnil.fr/fr/cookies-traceurs-que-dit-la-loi"
          target="_blank"
          rel="noopener"
        >
          {"Cookies & traceurs : que dit la loi ?"}
        </a>
      </li>
      <li>
        <a
          href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/comment-se-proteger/maitriser-votre-navigateur"
          target="_blank"
          rel="noopener"
        >
          Cookies : les outils pour les maîtriser
        </a>
      </li>
    </ul>
  </>
);
