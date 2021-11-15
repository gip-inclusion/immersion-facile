import { v4 as uuidV4 } from "uuid";
import {
  BusinessContactDto,
  FormEstablishmentId,
  formEstablishmentIdSchema,
} from "../../../shared/FormEstablishmentDto";
import { UseCase } from "../../core/UseCase";
import { SireneRepository } from "../../sirene/ports/SireneRepository";
import { ImmersionEstablishmentContact } from "../entities/ImmersionOfferEntity";
import {
  GetPosition,
  UncompleteEstablishmentEntity,
} from "../entities/UncompleteEstablishmentEntity";
import { FormEstablishmentRepository } from "../ports/FormEstablishmentRepository";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";

export class TransformFormEstablishmentIntoSearchData extends UseCase<
  FormEstablishmentId,
  void
> {
  constructor(
    private readonly formEstablishmentRepository: FormEstablishmentRepository,
    private immersionOfferRepository: ImmersionOfferRepository,
    private getPosition: GetPosition,
    private sireneRepository: SireneRepository, // private getExtraEstablishmentInfos: GetExtraEstablishmentInfos,
  ) {
    super();
  }

  inputSchema = formEstablishmentIdSchema;

  public async _execute(id: FormEstablishmentId): Promise<void> {
    const formEstablishment = await this.formEstablishmentRepository.getById(
      id,
    );
    if (!formEstablishment) return;

    const establishmentContact: ImmersionEstablishmentContact =
      convertBusinessContactDtoToImmersionEstablishmentContact(
        formEstablishment.businessContacts[0],
        formEstablishment.siret,
      );

    const romeCodes = formEstablishment.professions
      .map((x) => x.romeCodeMetier)
      .filter((x): x is string => x !== undefined);

    const uncompleteEstablishmentEntity: UncompleteEstablishmentEntity =
      new UncompleteEstablishmentEntity({
        id: uuidV4(),
        siret: formEstablishment.siret,
        name: formEstablishment.businessName,
        address: formEstablishment.businessAddress,
        score: 10,
        voluntaryToImmersion: true,
        romes: romeCodes,
        dataSource: "form",
        contactInEstablishment: establishmentContact,
        contactMode: formEstablishment.preferredContactMethods[0],
      });

    const establishmentEntity =
      await uncompleteEstablishmentEntity.searchForMissingFields(
        this.getPosition,
        this.sireneRepository,
      );

    if (!establishmentEntity) return;

    await this.immersionOfferRepository.insertEstablishments([
      establishmentEntity,
    ]);
    await this.immersionOfferRepository.insertEstablishmentContact(
      establishmentContact,
    );
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
});
