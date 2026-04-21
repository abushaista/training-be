import { CatalogRepository } from "@app/modules/course/domain/repositories/catalog.repository";
import { Injectable, NotFoundException } from "@nestjs/common";

@Injectable()
export class GetCatalogUseCase {
    constructor(private catalogRepository: CatalogRepository) { }
    async execute(courseId: string) {
        const catalog = await this.catalogRepository.getCurrentCatalog(courseId);

        if (!catalog) {
            throw new NotFoundException("Catalog not found");
        }

        return catalog;
    }
}
