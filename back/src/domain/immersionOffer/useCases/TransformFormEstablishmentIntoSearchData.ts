import { v4 as uuidV4 } from "uuid";
import {
  BusinessContactDto,
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "../../../shared/FormEstablishmentDto";
import { ProfessionDto } from "../../../shared/rome";
import { SequenceRunner } from "../../core/ports/SequenceRunner";
import { UseCase } from "../../core/UseCase";
import { RomeGateway } from "../../rome/ports/RomeGateway";
import { SireneRepository } from "../../sirene/ports/SireneRepository";
import { ImmersionEstablishmentContact } from "../entities/ImmersionOfferEntity";
import {
  GetPosition,
  UncompleteEstablishmentEntity,
} from "../entities/UncompleteEstablishmentEntity";
import { FormEstablishmentRepository } from "../ports/FormEstablishmentRepository";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class TransformFormEstablishmentIntoSearchData extends UseCase<
  FormEstablishmentDto,
  void
> {
  constructor(
    private readonly formEstablishmentRepository: FormEstablishmentRepository,
    private immersionOfferRepository: ImmersionOfferRepository,
    private getPosition: GetPosition,
    private sireneRepository: SireneRepository,
    private romeGateway: RomeGateway,
    private sequenceRunner: SequenceRunner,
  ) {
    super();
  }

  inputSchema = formEstablishmentSchema;

  public async _execute(dto: FormEstablishmentDto): Promise<void> {
    const formEstablishment = await this.formEstablishmentRepository.getById(
      dto.id,
    );
    if (!formEstablishment) return;

    const establishmentContact: ImmersionEstablishmentContact =
      convertBusinessContactDtoToImmersionEstablishmentContact(
        formEstablishment.businessContacts[0],
        formEstablishment.siret,
      );

    const romeAppellationToConvert = formEstablishment.professions
      .filter(
        ({ romeCodeAppellation, romeCodeMetier }) =>
          !romeCodeMetier && !!romeCodeAppellation,
      )
      .map((p): string => p.romeCodeAppellation!);

    const romeCodesFromAppellation = (
      await this.sequenceRunner.run(
        romeAppellationToConvert,
        async (appellation) =>
          this.romeGateway.appellationToCodeMetier(appellation),
      )
    ).filter((x): x is string => x !== undefined);

    const romeCodes = formEstablishment.professions
      .filter((p): p is Required<ProfessionDto> => !!p.romeCodeMetier)
      .map((p) => p.romeCodeMetier);

    const allRomeCodes = [...romeCodesFromAppellation, ...romeCodes];

    const uncompleteEstablishmentEntity: UncompleteEstablishmentEntity =
      new UncompleteEstablishmentEntity({
        id: uuidV4(),
        siret: formEstablishment.siret,
        name: formEstablishment.businessName,
        address: formEstablishment.businessAddress,
        score: 10,
        voluntaryToImmersion: true,
        romes: allRomeCodes,
        dataSource: "form",
        contactInEstablishment: establishmentContact,
        contactMode: formEstablishment.preferredContactMethods[0],
      });

    const establishmentEntity =
      await uncompleteEstablishmentEntity.searchForMissingFields(
        this.getPosition,
        this.sireneRepository,
      );

    if (!establishmentEntity) {
      logger.error(
        "Tried to add invalid establishment in database with siret " +
          uncompleteEstablishmentEntity.getSiret(),
      );
      return;
    }

    await this.immersionOfferRepository
      .insertEstablishments([establishmentEntity])
      .catch((err) => {
        logger.error(
          "Error in inserting establishment for siret : " +
            formEstablishment.siret,
        );
      });
    await this.immersionOfferRepository
      .insertEstablishmentContact(establishmentContact)
      .catch((err) => {
        logger.error(
          "Error in inserting form establishment contact for siret : " +
            formEstablishment.siret,
        );
      });
    await this.immersionOfferRepository.insertImmersions(
      establishmentEntity.extractImmersions(),
    );
  }
}

const convertBusinessContactDtoToImmersionEstablishmentContact = (
  businessContactDto: BusinessContactDto,
  siret_institution: string,
): ImmersionEstablishmentContact => ({
  id: uuidV4(),
  name: businessContactDto.lastName,
  firstname: businessContactDto.firstName,
  email: businessContactDto.email,
  role: businessContactDto.job,
  siretEstablishment: siret_institution,
  phone: businessContactDto.phone,
});
