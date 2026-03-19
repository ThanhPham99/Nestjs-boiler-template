import { Entity, Property, Unique, Enum, Opt } from '@mikro-orm/core';
import { BaseEntity } from '@database/entities/base.entity';
import { UserRole } from '../enums/user-role.enum';

@Entity()
export class User extends BaseEntity<User> {
  @Property()
  @Unique()
  email!: string;

  @Property({ hidden: true })
  password!: string;

  @Property()
  name!: string;

  @Enum(() => UserRole)
  role: UserRole & Opt = UserRole.USER;

  @Property()
  is_active: boolean & Opt = true;
}
