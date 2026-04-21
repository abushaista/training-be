export interface BaseSnapshot<TState = any> {
    id: string;
    state: TState;
    version: number;
}