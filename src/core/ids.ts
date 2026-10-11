declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type EntityId = Brand<string, 'EntityId'>;
export type ConnectionId = Brand<string, 'ConnectionId'>;

export const entityId = (s: string): EntityId => s as EntityId;
export const connectionId = (s: string): ConnectionId => s as ConnectionId;
