export class CourseState {
    constructor(
        public id: string,
        public title?: string,
        public content?: string,
        public description?: string | null,
        public authorId?: string,
        public status?: 'DRAFT' | 'PUBLISHED',
        public version = 0,
    ) { }
}