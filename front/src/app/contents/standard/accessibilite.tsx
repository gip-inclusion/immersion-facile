import { immersionFacileContactEmail } from "shared";
import { SectionTitle } from "./headings";
import type { VersionnedStandardContent } from "./textSetup";

export default {
  latest: {
    title: "Accessibilité",
    content: () => <LatestAccessibilityContent />,
  },
} satisfies VersionnedStandardContent;

const LatestAccessibilityContent = () => (
  <>
    <SectionTitle>Déclaration d’accessibilité</SectionTitle>
    <p>
      Le GIP Plateforme de l’inclusion s’engage à rendre ses sites internet et
      applications accessibles conformément à l’article 47 de la loi n°2005-102
      du 11 février 2005. Son schéma pluriannuel décrit les points importants
      sur lesquels le GIP de la plateforme de l’inclusion s’appuiera pour
      améliorer l’accessibilité numérique de l’ensemble de ses sites internet et
      applications.
    </p>
    <p>
      Ce schéma s’accompagne du plans d’action annuels (
      <a
        target="_blank"
        href="https://inclusion.beta.gouv.fr/documents/86/GIP_plateforme_de_linclusion_-_Plan_annuel_daccessibilite_2023.pdf"
        rel="noopener"
      >
        2023
      </a>
      ) qui détaillent les opérations programmées et mises en œuvre pour l'année
      courante, ainsi que l’état de suivis de ces actions, détaillé dans le{" "}
      <a
        target="_blank"
        href="https://inclusion.beta.gouv.fr/documents/87/GIP_plateforme_de_linclusion_-_Schema_pluriannuel_daccessibilite_2023-2026.pdf"
        rel="noopener"
      >
        schéma pluriannuel d’accessibilité 2023-2026
      </a>
      . Cette déclaration d’accessibilité s’applique à
      https://immersion-facile.beta.gouv.fr.
    </p>

    <SectionTitle>État de conformité</SectionTitle>
    <p>
      Immersion Facilitée (https://immersion-facile.beta.gouv.fr) est
      partiellement conforme avec le référentiel général d’amélioration de
      l’accessibilité (RGAA), version 4 en raison des non-conformités et des
      dérogations énumérées ci-dessous.
    </p>

    <SectionTitle>Résultats des tests</SectionTitle>
    <p>
      L’audit de conformité réalisé par GIP Plateforme de l'Inclusion révèle que
      52% des critères du RGAA version 4 sont respectés.
    </p>

    <SectionTitle>
      Établissement de cette déclaration d’accessibilité
    </SectionTitle>
    <p>
      Cette déclaration a été établie le 15 décembre 2022. Elle a été mise à
      jour le 15 décembre 2022.
    </p>

    <SectionTitle>
      Technologies utilisées pour la réalisation l’audit
    </SectionTitle>
    <ul>
      <li>HTML</li>
      <li>CSS</li>
      <li>JavaScript</li>
    </ul>

    <SectionTitle>Environnement de test</SectionTitle>
    <p>
      Les vérifications de restitution de contenus ont été réalisées sur la base
      de la combinaison fournie par la base de référence du RGAA, avec les
      versions suivantes :
    </p>
    <ul>
      <li>Sur ordinateur MacOS avec Firefox et VoiceOver</li>
    </ul>

    <SectionTitle>Outils pour évaluer l’accessibilité</SectionTitle>
    <ul>
      <li>HeadingsMap</li>
      <li>Web Accessibility Toolbar</li>
      <li>WCAG Contrast checker</li>
      <li>Color Contrast Analyser</li>
      <li>Validateur en ligne W3C</li>
      <li>Windows Narrator</li>
      <li>Librairie Axe</li>
    </ul>

    <SectionTitle>
      Pages du site ayant fait l’objet de la vérification de conformité
    </SectionTitle>
    <ul>
      <li>
        Formulaire d'ajout d'organisme (prescripteur)
        https://immersion-facile.beta.gouv.fr/ajouter-prescripteur
      </li>
      <li>Accueil https://immersion-facile.beta.gouv.fr/</li>
      <li>Recherche https://immersion-facile.beta.gouv.fr/recherche</li>
      <li>
        Formulaire de demande de convention
        https://immersion-facile.beta.gouv.fr/demande-immersion
      </li>
      <li>
        Formulaire de référencement d'une entreprise
        https://immersion-facile.beta.gouv.fr/establishment
      </li>
    </ul>

    <SectionTitle>Retour d’information et contact</SectionTitle>
    <p>
      Si vous n’arrivez pas à accéder à un contenu ou à un service, vous pouvez
      contacter le responsable du site Immersion Facilitée pour être orienté
      vers une alternative accessible ou obtenir le contenu sous une autre
      forme.
    </p>
    <ul>
      <li>
        Envoyer un message :{" "}
        <a
          target="_blank"
          href="https://immersion-facile.beta.gouv.fr/aide/"
          rel="noopener"
        >
          https://immersion-facile.beta.gouv.fr/aide/
        </a>
      </li>
      <li>
        Contacter GIP Plateforme de l'Inclusion : {immersionFacileContactEmail}
      </li>
    </ul>

    <SectionTitle>Voies de recours</SectionTitle>
    <p>
      Si vous constatez un défaut d’accessibilité vous empêchant d’accéder à un
      contenu ou une fonctionnalité du site, que vous nous le signalez et que
      vous ne parvenez pas à obtenir une réponse de notre part, vous êtes en
      droit de faire parvenir vos doléances ou une demande de saisine au
      Défenseur des droits. Plusieurs moyens sont à votre disposition :
    </p>
    <ul>
      <li>Écrire un message au Défenseur des droits</li>
      <li>Contacter le délégué du Défenseur des droits dans votre région</li>
      <li>
        Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre)
        <br />
        Défenseur des droits
        <br />
        Libre réponse 71120
        <br />
        75342 Paris CEDEX 07
      </li>
    </ul>
  </>
);
