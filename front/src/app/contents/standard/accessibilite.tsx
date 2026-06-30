import { immersionFacileContactEmail } from "shared";
import { SectionTitle } from "./headings";
import type { VersionnedStandardContent } from "./textSetup";

const schemaPluriannuelAccessibilite2026To2028Url =
  "https://www.francetravail.fr/files/live/sites/PE/files/fichiers-en-telechargement/accessibilite/Schema-pluriannuel-accessibilite-2023-2025-V1.pdf";

const planActionAccessibilite2025Url =
  "https://www.francetravail.fr/files/live/sites/PE/files/fichiers-en-telechargement/accessibilite/Plan-annuel-accessibilite-25.pdf";

const planActionAccessibilite2026Url =
  "https://www.francetravail.fr/files/live/sites/PE/files/fichiers-en-telechargement/accessibilite/Plan-annuel-26-FT.pdf";

export default {
  latest: {
    title: "Accessibilité",
    content: () => <LatestAccessibilityContent />,
  },
} satisfies VersionnedStandardContent;

const LatestAccessibilityContent = () => (
  <>
    <SectionTitle>Déclaration d’accessibilité</SectionTitle>
    <p>Établie le 25 juin 2026.</p>
    <p>
      France Travail s’engage à rendre ses services accessibles, conformément à
      l’article 47 de la loi n° 2005-102 du 11 février 2005.
    </p>
    <p>À cette fin, nous mettons en œuvre la stratégie et les actions suivantes :</p>
    <ul>
      <li>
        <a
          target="_blank"
          href={schemaPluriannuelAccessibilite2026To2028Url}
          rel="noopener"
        >
          Schéma pluriannuel de mise en accessibilité 2026-2028 (pdf 426 Ko)
        </a>
      </li>
      <li>
        <a
          target="_blank"
          href={planActionAccessibilite2025Url}
          rel="noopener"
        >
          Plan d&apos;action 2025 (pdf 169 Ko)
        </a>
      </li>
      <li>
        <a
          target="_blank"
          href={planActionAccessibilite2026Url}
          rel="noopener"
        >
          Plan d&apos;action 2026 (pdf 173 Ko)
        </a>
      </li>
    </ul>
    <p>
      Cette déclaration d’accessibilité s’applique à Immersion Facilitée (
      <a
        target="_blank"
        href="https://immersion-facile.beta.gouv.fr/"
        rel="noopener"
      >
        https://immersion-facile.beta.gouv.fr/
      </a>
      ).
    </p>

    <SectionTitle>État de conformité</SectionTitle>
    <p>
      Immersion Facilitée est partiellement conforme avec le référentiel général
      d’amélioration de l’accessibilité (RGAA), version 4.1.
    </p>

    <SectionTitle>Résultats des tests</SectionTitle>
    <p>
      L’audit de conformité réalisé en auto-évaluation révèle que 52&nbsp;% des
      critères sont respectés.
    </p>

    <SectionTitle>Amélioration et contact</SectionTitle>
    <p>
      Si vous n’arrivez pas à accéder à un contenu ou à un service, vous pouvez
      contacter le responsable de Immersion Facilitée pour être orienté vers une
      alternative accessible ou obtenir le contenu sous une autre forme.
    </p>
    <p>
      E-mail :{" "}
      <a href={`mailto:${immersionFacileContactEmail}`}>
        {immersionFacileContactEmail}
      </a>
      <br />
      Nous essayons de répondre dans les 2 jours ouvrés.
    </p>

    <SectionTitle>Voie de recours</SectionTitle>
    <p>
      Cette procédure est à utiliser dans le cas suivant : vous avez signalé au
      responsable du site internet un défaut d’accessibilité qui vous empêche
      d’accéder à un contenu ou à un des services du portail et vous n’avez pas
      obtenu de réponse satisfaisante.
    </p>
    <p>Vous pouvez :</p>
    <ul>
      <li>Écrire un message au Défenseur des droits</li>
      <li>Contacter le délégué du Défenseur des droits dans votre région</li>
      <li>
        Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) :
        <br />
        Défenseur des droits
        <br />
        Libre réponse 71120
        <br />
        75342 Paris CEDEX 07
      </li>
    </ul>
    <p>
      Cette déclaration d’accessibilité a été créée le 25 juin 2026 grâce au
      Générateur de Déclaration d&apos;Accessibilité.
    </p>
  </>
);
