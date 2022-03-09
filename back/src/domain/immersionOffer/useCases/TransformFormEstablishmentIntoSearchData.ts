import {
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "../../../shared/FormEstablishmentDto";
import { NafDto } from "../../../shared/naf";
import { createLogger } from "../../../utils/logger";
import { notifyAndThrowErrorDiscord } from "../../../utils/notifyDiscord";
import { Clock } from "../../core/ports/Clock";
import { SequenceRunner } from "../../core/ports/SequenceRunner";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { UseCase } from "../../core/UseCase";
import { RomeGateway } from "../../rome/ports/RomeGateway";
import {
  SireneEstablishmentVO,
  SireneRepository,
  SireneRepositoryAnswer,
} from "../../sirene/ports/SireneRepository";
import { ContactEntityV2 } from "../entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
  TefenCode,
} from "../entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../entities/ImmersionOfferEntity";
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
    private readonly clock: Clock,
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
      notifyAndThrowErrorDiscord(
        new Error(
          `Could not get siret ${establishmentSiret} from siren gateway`,
        ),
      );
      return;
    }
    const nafDto = inferNafDtoFromSireneAnswer(sireneRepoAnswer);
    const numberEmployeesRange =
      inferNumberEmployeesRangeFromSireneAnswer(sireneRepoAnswer);

    if (!nafDto || !position || numberEmployeesRange === undefined) {
      notifyAndThrowErrorDiscord(
        new Error(
          `Some field from siren gateway are missing for establishment with siret ${establishmentSiret}`,
        ),
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
      contactMethod: formEstablishment.preferredContactMethods[0],
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
              romeCode: romeCodeMetier,
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
                romeCode: correspondingRome,
                score: offerFromFormScore,
              };
          }
        },
      )
    ).filter((offer): offer is ImmersionOfferEntityV2 => !!offer);

    const establishment: EstablishmentEntityV2 = {
      siret: establishmentSiret,
      name: formEstablishment.businessName,
      customizedName: formEstablishment.businessNameCustomized,
      isCommited: formEstablishment.isEngagedEnterprise,
      address: formEstablishment.businessAddress,
      voluntaryToImmersion: true,
      dataSource: "form",
      nafDto,
      position,
      numberEmployeesRange,
      isActive: true,
      updatedAt: this.clock.now(),
    };

    const establishmentAggregate: EstablishmentAggregate = {
      establishment,
      contact: contact,
      immersionOffers,
    };
    await this.immersionOfferRepository
      .insertEstablishmentAggregates([establishmentAggregate])
      .catch((err) => {
        notifyAndThrowErrorDiscord(
          new Error(
            `Error when adding establishment aggregate with siret ${establishmentSiret} due to ${err}`,
          ),
        );
      });
  }
}

// Those will probably be shared in a utils/helpers folder
const inferNafDtoFromSireneAnswer = (
  sireneRepoAnswer: SireneRepositoryAnswer,
): NafDto | undefined => {
  const establishmentProps = sireneRepoAnswer.etablissements[0];
  if (!establishmentProps) return;
  return new SireneEstablishmentVO(establishmentProps).nafAndNomenclature;
};

const inferNumberEmployeesRangeFromSireneAnswer = (
  sireneRepoAnswer: SireneRepositoryAnswer,
): TefenCode => {
  const tefenCode =
    sireneRepoAnswer.etablissements[0].uniteLegale.trancheEffectifsUniteLegale;

  if (tefenCode && tefenCode != "NN") return <TefenCode>+tefenCode;
  return -1;
};
