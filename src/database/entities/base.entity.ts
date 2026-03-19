import { PrimaryKey, Property, Opt } from '@mikro-orm/core';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export abstract class BaseEntity<T> {
  @PrimaryKey()
  id!: number;

  @Property({ hidden: true, defaultRaw: 'now()' })
  created_at: Date & Opt = new Date();

  @Property({ hidden: true, defaultRaw: 'now()', onUpdate: () => new Date() })
  updated_at: Date & Opt = new Date();

  constructor() {}

  static create<T extends BaseEntity<T>>(
    this: new () => T,
    data: Partial<T>,
  ): T {
    const instance = new this();
    Object.assign(instance, data);
    return instance;
  }
}
