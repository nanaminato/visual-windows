export interface IStateService {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  subscribe<T>(key: string, callback: (value: T) => void): void;
  unsubscribe(key: string, callback: Function): void;
}
