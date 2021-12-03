import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import {
  EstablishmentFromLaBonneBoite,
  HttpCallsToLaBonneBoite,
  LaBonneBoiteGateway,
} from "../../../adapters/secondary/immersionOffer/LaBonneBoiteGateway";
import {
  GetEstablishmentsResponse,
  HttpCallsToLaPlateFormeDeLInclusion,
  LaPlateFormeDeLInclusionGateway,
} from "../../../adapters/secondary/immersionOffer/LaPlateFormeDeLInclusionGateway";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { ImmersionOfferEntity } from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import { SearchParams } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { UpdateEstablishmentsAndImmersionOffersFromLastSearches } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsAndImmersionOffersFromLastSearches";
import {
  fakeAccessTokenGateway,
  fakeGetPosition,
} from "../../../_testBuilders/FakeHttpCalls";

export const fakeHttpCallToLaPlateFormeDeLInclusion: HttpCallsToLaPlateFormeDeLInclusion =
  {
    getEstablishments: async (
      _searchParams: SearchParams,
    ): Promise<GetEstablishmentsResponse> => ({
      results: [
        {
          cree_le: new Date("2019-12-05T15:37:56.609000+01:00"),
          mis_a_jour_le: new Date("2020-10-08T17:29:40.320879+02:00"),
          siret: "20006765000016",
          type: "ACI",
          raison_sociale: "COMMUNAUTE DE COM HOUVE PAYS BOULAGEOIS",
          enseigne: "Communaute de com houve pays boulageois",
          site_web: "",
          description: "",
          bloque_candidatures: false,
          addresse_ligne_1: "29 Rue de Sarrelouis",
          addresse_ligne_2: "",
          code_postal: "57220",
          ville: "Boulay-Moselle",
          departement: "57",
          postes: [
            {
              id: 12201,
              rome: "Maintenance des bâtiments et des locaux (I1203)",
              cree_le: new Date("2020-12-15T15:34:13.086820+01:00"),
              mis_a_jour_le: new Date("2021-06-25T14:54:08.601918+02:00"),
              recrutement_ouvert: "True",
              description:
                "Le salarié effectue la maintenance et l'entretien des locaux et espaces à usage collectif (locaux communaux, établissements hospitaliers, maisons de retraite, immeubles, écoles, locaux d'entreprises,...) selon les règles de sécurité, et l'entretien des espaces verts (tonte, élagage, débroussaillage etc...)\r\n\r\nLieu de travail : Boulay et territoire de la CCHPB.\r\n\r\nActivité : Entretien des espaces verts, peinture, petite maçonnerie, manutention, pose de carrelage, isolation etc...\r\n\r\nCompétences : Sous la responsabilité d'un encadrant technique, assurer une maintenance de premier niveau en bricolage, réparation, Préparer un support à enduire, Appliquer des gammes de peintures, vernis, enduits ou laques, Entretenir un espace extérieur, Suivre l'état des stocks, Définir des besoins en approvisionnement, Entretenir le matériel\r\n\r\nModalités : CDDI temps partiel de 4 mois renouvelable jusqu'à 2 ans maximum, base 26h/semaine, Salaire : SMIC\r\n\r\nQualités requises : ponctuel, volontaire, bonne condition physique\r\n\r\nConditions d'accès : Éligible à un contrat aidé, pas de diplôme particulier, un CAP/BEP dans des spécialités du bâtiment second œuvre (peinture, plomberie, électricité,...) est un plus. Habiter dans une commune de la Communauté de Communes de la Houve et du Pays Boulageois.\r\n\r\n",
              appellation_modifiee:
                "maintenance des locaux et entretien des espaces verts",
            },
            {
              id: 12187,
              rome: "Conduite de transport en commun sur route (N4103)",
              cree_le: new Date("2020-12-15T14:10:40.622674+01:00"),
              mis_a_jour_le: new Date("2021-09-21T10:38:49.843120+02:00"),
              recrutement_ouvert: "True",
              description:
                "Le chauffeur réalise le transport en commun de personnes, selon la règlementation routière, les règles de sécurité des biens et des personnes et les impératifs de délai et de qualité. Il travaille au sein du Service SOLI'BUS de la Communauté de communes de la Houve et du Pays Boulageois dont le bureau est à BOULAY.\r\nLe service fonctionne 24h/24 et 7j/7, le chauffeur travail donc sur postes.\r\n\r\nMoyens : minibus 9 places équipés de GPS et téléphones portables\r\n\r\nActivité : Prépare les véhicules, repère le parcours et prévoir les aléas, Accueille, renseigne les passagers et les assiste si besoin, Conduis les passagers selon un parcours prédéfini, Renseigne les documents de bord d'un véhicule, Contrôle l'état de fonctionnement du véhicule et effectue le nettoyage, Déclenche les mesures d'urgence en cas d'incident\r\n\r\nModalités : CDDI temps partiel de 4 mois, renouvelables jusqu'à 2 ans maximum, base 26h/semaine, Salaire : SMIC\r\nQualités requises : Ponctualité, Rigueur, Sens des responsabilités, Discrétion, Capacités relationnelles, autonomie, Organisation et méthodologie, Disponibilité, Respect du secret professionnel, Aptitude à rendre compte\r\n\r\nCondition d’accès : être éligible à un contrat aidé, Accessible sans diplôme ni expérience professionnelle d'accès, être titulaire du permis de conduire européen en cours de validité depuis au moins 3 ans sans accident responsable. Habiter dans une commune de la Communauté de Communes de la Houve et du Pays Boulageois ou une une commune proche (maximum 30 km de Boulay)\r\n",
              appellation_modifiee:
                "Chauffeur dans un service de transport à la demande ",
            },
            {
              id: 12191,
              rome: "Secrétariat (M1607)",
              cree_le: new Date("2020-12-15T14:34:54.601977+01:00"),
              mis_a_jour_le: new Date("2021-09-21T10:38:49.849730+02:00"),
              recrutement_ouvert: "True",
              description:
                "La secrétaire exécute des travaux administratifs courants (vérification de documents, frappe et mise en forme des courriers préétablis, suivi de dossier administratif, ...) selon l'organisation de la structure ou du service. Elle peut être en charge des activités de reprographie et d'archivage. Elle peut réaliser l'accueil de la structure. \r\n\r\n\r\nLieu de travail : Service SOLI’BUS à BOULAY\r\n\r\nActivité : Constitue des dossiers administratifs, Gère la planification du Transport à la demande, Assure l'accueil téléphonique et physique, Encaissement, Numérise les documents\r\n\r\nCompétences : Maitrise de l'outil informatique : Word, Excel, Bonne connaissance du français, Gestion administrative, Méthode de classement et d'archivage \r\n\r\nModalités : CDDI temps partiel de 4 mois renouvelable jusqu'à 2 ans maximum, base 26h/semaine, Salaire : SMIC\r\n\r\nQualités requises : Rigueur, Sens des responsabilités, Discrétion, Capacités relationnelles, Autonomie, Organisation et méthodologie, Disponibilité, Respect du secret professionnel, Aptitude à rendre compte, \r\n\r\nConditions d'accès : Éligible à un contrat aidé, Diplôme de fin d'études secondaires à Bac dans le secteur du tertiaire, Accessible avec expérience professionnelle, sans diplôme particulier. Habiter dans une commune de la Communauté de Communes de la Houve et du Pays Boulageois ou une une commune proche (maximum 30 km de Boulay)",
              appellation_modifiee:
                "Secrétaire au sein d'un service de transport à la demande",
            },
          ],
        },
      ],
      nextPageUrl: "",
    }),
    getNextEstablishments: async (
      _url: string,
    ): Promise<GetEstablishmentsResponse> => ({ results: [] }),
  };

export const fakeHttpCallToLaBonneBoite: HttpCallsToLaBonneBoite = {
  getEstablishments: async (
    _searchParams: SearchParams,
    _accessToken: string,
  ): Promise<EstablishmentFromLaBonneBoite[]> => [
    {
      address:
        "Service des ressources humaines,  IMPASSE FENDERIE, 57290 SEREMANGE-ERZANGE",
      city: "SEREMANGE-ERZANGE",
      lat: 49.3225,
      lon: 6.08067,
      matched_rome_code: "M1607",
      naf: "8810C",
      name: "BLANCHISSERIE LA FENSCH",
      siret: "77561959600155",
      stars: 4.5,
    },
  ],
};

const inMemorySireneRepository = new InMemorySireneRepository();

describe("UpdateEstablishmentsAndImmersionOffersFromLastSearches", () => {
  let updateEstablishmentsAndImmersionOffersFromLastSearches: UpdateEstablishmentsAndImmersionOffersFromLastSearches;
  let immersionOfferRepository: InMemoryImmersionOfferRepository;
  let fakeLaBonneBoiteGateway: LaBonneBoiteGateway;
  let fakeLaPlateFormeDeLInclusionGateway: LaPlateFormeDeLInclusionGateway;

  beforeEach(() => {
    immersionOfferRepository = new InMemoryImmersionOfferRepository();
    immersionOfferRepository.empty();
    fakeLaBonneBoiteGateway = new LaBonneBoiteGateway(
      fakeAccessTokenGateway,
      "poleEmploiClientId",
      fakeHttpCallToLaBonneBoite,
    );
    fakeLaPlateFormeDeLInclusionGateway = new LaPlateFormeDeLInclusionGateway(
      fakeHttpCallToLaPlateFormeDeLInclusion,
    );

    updateEstablishmentsAndImmersionOffersFromLastSearches =
      new UpdateEstablishmentsAndImmersionOffersFromLastSearches(
        fakeLaBonneBoiteGateway,
        fakeLaPlateFormeDeLInclusionGateway,
        fakeGetPosition,
        inMemorySireneRepository,
        immersionOfferRepository,
      );
  });

  it("when Immersion search have been made lately, their information gets persisted in our system", async () => {
    // prepare
    const search: SearchParams = {
      rome: "A1203",
      distance_km: 10.0,
      lat: 10.0,
      lon: 20.0,
    };
    immersionOfferRepository.setSearches([search]);

    // act
    await updateEstablishmentsAndImmersionOffersFromLastSearches.execute();

    // assert
    const exectedImmersionOffer = new ImmersionOfferEntity({
      id: "c005bb90-703d-4477-a5ac-b006c631a736",
      rome: "A1203",
      naf: "8559A",
      siret: "24570135400111",
      name: "Chantier d'insertion de l'Arc Mosellan (CCAM)",
      voluntaryToImmersion: false,
      data_source: "api_laplateformedelinclusion",
      contactInEstablishment: undefined,
      score: 6,
      position: { lat: 43.8666, lon: 1.3333 },
    });

    expect(immersionOfferRepository.searches).toHaveLength(0);

    //We expect to find the immersion in results
    const immersionOffersInRepo = immersionOfferRepository.immersionOffers;

    expect(immersionOffersInRepo).toHaveLength(4);

    expect(
      immersionOffersInRepo.filter(
        (immersionOffer) => immersionOffer.getRome() === "M1607",
      ),
    ).toHaveLength(2);
  });
});
