import {
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "../../../shared/FormEstablishmentDto";
import { createLogger } from "../../../utils/logger";
import { SequenceRunner } from "../../core/ports/SequenceRunner";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { UseCase } from "../../core/UseCase";
import { RomeGateway } from "../../rome/ports/RomeGateway";
import {
  SireneRepository,
  SireneRepositoryAnswer,
} from "../../sirene/ports/SireneRepository";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
  TefenCode,
} from "../entities/EstablishmentAggregate";
import {
  ContactEntityV2,
  ImmersionOfferEntityV2,
} from "../entities/ImmersionOfferEntity";
import { AdresseAPI } from "../ports/AdresseAPI";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";

const logger = createLogger(__filename);

const offerFromFormScore = 10; // 10/10 if voluntaryToImmersion=true (consider removing this field)

export class TransformFormEstablishmentIntoSearchData extends UseCase<
  FormEstablishmentDto,
  void
> {
  constructor(
    private readonly immersionOfferRepository: ImmersionOfferRepository,
    private readonly adresseAPI: AdresseAPI,
    private readonly sireneRepository: SireneRepository,
    private readonly romeGateway: RomeGateway,
    private readonly sequenceRunner: SequenceRunner,
    private readonly uuidGenerator: UuidGenerator,
  ) {
    super();
  }

  inputSchema = formEstablishmentSchema;

  public async _execute(
    formEstablishment: FormEstablishmentDto,
  ): Promise<void> {
    const establishmentSiret = formEstablishment.siret;

    const position = await this.adresseAPI.getPositionFromAddress(
      formEstablishment.businessAddress,
    );
    const sireneRepoAnswer = await this.sireneRepository.get(
      establishmentSiret,
    );
    if (!sireneRepoAnswer) {
      logger.error(
        `Could not get siret ${establishmentSiret} from siren gateway`,
      );
      return;
    }
    const naf = inferNafFromSireneAnswer(sireneRepoAnswer);
    const numberEmployeesRange =
      inferNumberEmployeesRangeFromSireneAnswer(sireneRepoAnswer);

    if (
      !naf ||
      !position ||
      numberEmployeesRange === undefined ||
      numberEmployeesRange == -1
    ) {
      logger.error(
        `Some field from siren gateway are missing for establishment with siret ${establishmentSiret}`,
      );
      return;
    }

    const contact: ContactEntityV2 = {
      id: this.uuidGenerator.new(),
      firstName: formEstablishment.businessContacts[0].firstName,
      lastName: formEstablishment.businessContacts[0].lastName,
      email: formEstablishment.businessContacts[0].email,
      phone: formEstablishment.businessContacts[0].phone,
      job: formEstablishment.businessContacts[0].job,
    };

    const immersionOffers: ImmersionOfferEntityV2[] = (
      await this.sequenceRunner.run(
        formEstablishment.professions,
        async ({
          romeCodeMetier,
          romeCodeAppellation,
        }): Promise<ImmersionOfferEntityV2 | undefined> => {
          if (romeCodeMetier) {
            return {
              id: this.uuidGenerator.new(),
              rome: romeCodeMetier,
              score: offerFromFormScore,
            };
          } else if (romeCodeAppellation) {
            const correspondingRome =
              await this.romeGateway.appellationToCodeMetier(
                romeCodeAppellation,
              );

            if (correspondingRome)
              return {
                id: this.uuidGenerator.new(),
                rome: correspondingRome,
                score: offerFromFormScore,
              };
          }
        },
      )
    ).filter((offer): offer is ImmersionOfferEntityV2 => !!offer);

    const establishment: EstablishmentEntityV2 = {
      siret: establishmentSiret,
      name: formEstablishment.businessName,
      address: formEstablishment.businessAddress,
      voluntaryToImmersion: true,
      dataSource: "form",
      naf,
      position,
      numberEmployeesRange,
      contactMethod: formEstablishment.preferredContactMethods[0],
    };

    const establishmentAggregate: EstablishmentAggregate = {
      establishment,
      contacts: [contact],
      immersionOffers,
    };
    await this.immersionOfferRepository
      .insertEstablishmentAggregates([establishmentAggregate])
      .catch((err) => {
        logger.error(
          { error: err, siret: establishmentSiret },
          "Error when adding establishment aggregate ",
        );
      });
  }
}

// Those will probably be shared in a utils/helpers folder
const inferNafFromSireneAnswer = (sireneRepoAnswer: SireneRepositoryAnswer) =>
  sireneRepoAnswer.etablissements[0].uniteLegale.activitePrincipaleUniteLegale?.replace(
    ".",
    "",
  );

const inferNumberEmployeesRangeFromSireneAnswer = (
  sireneRepoAnswer: SireneRepositoryAnswer,
): TefenCode => {
  const tefenCode =
    sireneRepoAnswer.etablissements[0].uniteLegale.trancheEffectifsUniteLegale;

  if (tefenCode && tefenCode != "NN") return <TefenCode>+tefenCode;
  return -1;
};
