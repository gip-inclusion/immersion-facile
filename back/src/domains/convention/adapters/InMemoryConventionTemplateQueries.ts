import type {
  ConventionTemplate,
  ConventionTemplateId,
  DateTimeIsoString,
} from "shared";
import type { ConventionTemplateQueries } from "../ports/ConventionTemplateQueries";

export class InMemoryConventionTemplateQueries
  implements ConventionTemplateQueries
{
  #conventionTemplates: Record<ConventionTemplateId, ConventionTemplate> = {};

  public set conventionTemplates(templates: ConventionTemplate[]) {
    this.#conventionTemplates = templates.reduce(
      (acc, template) => ({
        ...acc,
        [template.id]: template,
      }),
      {},
    );
  }

  public get conventionTemplates(): ConventionTemplate[] {
    return Object.values(this.#conventionTemplates);
  }

  public async getById(
    id: ConventionTemplateId,
  ): Promise<ConventionTemplate | undefined> {
    return this.#conventionTemplates[id];
  }

  public async upsert(
    conventionTemplate: ConventionTemplate,
    _now: DateTimeIsoString,
  ): Promise<void> {
    this.#conventionTemplates[conventionTemplate.id] = conventionTemplate;
  }
}
