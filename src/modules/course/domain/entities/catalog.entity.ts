export class Catalog {
    constructor(
        public id: string,
        public title: string,
        public content: string,
        public description?: string,
        public publishedAt?: Date,
        public courseId?: string,
        public version: number = 0,
    ) { }
}