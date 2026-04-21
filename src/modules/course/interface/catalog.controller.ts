import { Controller, Get, Param, Req } from "@nestjs/common";
import { GetCatalogUseCase } from "../application/use-cases/get-catalog.usecase";
import { GetAllCatalogUseCase } from "../application/use-cases/get-all-catalog.usecase";

@Controller(['catalog', 'catalogs'])
export class CatalogController {
    constructor(
        private getCatalogUseCase: GetCatalogUseCase,
        private getAllCatalogUseCase: GetAllCatalogUseCase,
    ) { }

    @Get(':courseId')
    getCatalog(@Param('courseId') courseId: string) {
        return this.getCatalogUseCase.execute(courseId);
    }

    @Get()
    getAllCatalogs(@Req() req: any) {
        const { page, limit, query } = req.query;
        const pageNum = page ? Number(page) : 1;
        const limitNum = limit ? Number(limit) : 10;
        return this.getAllCatalogUseCase.execute(pageNum, limitNum, query as string);
    }
} 