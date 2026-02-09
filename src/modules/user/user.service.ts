import { Injectable } from '@nestjs/common';
import { EntityRepository, wrap } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly user_repository: EntityRepository<User>,
  ) {}

  async create(create_user_dto: CreateUserDto): Promise<User> {
    const user = this.user_repository.create(create_user_dto);
    await this.user_repository.getEntityManager().persistAndFlush(user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.user_repository.findAll();
  }

  async findOne(id: number): Promise<User> {
    return this.user_repository.findOneOrFail({ id });
  }

  async update(id: number, update_user_dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    wrap(user).assign(update_user_dto);
    await this.user_repository.getEntityManager().flush();
    return user;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.user_repository.getEntityManager().removeAndFlush(user);
  }
}
