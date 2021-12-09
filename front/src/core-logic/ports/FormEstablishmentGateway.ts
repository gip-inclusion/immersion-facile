import {
  FormEstablishmentDto,
  FormEstablishmentId,
} from "src/shared/FormEstablishmentDto";
import { RomeSearchMatchDto } from "src/shared/rome";

export interface FormEstablishmentGateway {
  addFormEstablishment: (
    establishment: FormEstablishmentDto,
  ) => Promise<FormEstablishmentId>;
  searchProfession: (searchText: string) => Promise<RomeSearchMatchDto[]>;
}
