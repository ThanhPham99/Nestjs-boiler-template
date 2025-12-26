import { PrimaryKey, Property } from '@mikro-orm/core';

export abstract class BaseEntity<T> {
  @PrimaryKey()
  id!: number;

  @Property({ hidden: true, defaultRaw: 'now()' })
  created_at = new Date();

  @Property({ hidden: true, defaultRaw: 'now()', onUpdate: () => new Date() })
  updated_at = new Date();

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
