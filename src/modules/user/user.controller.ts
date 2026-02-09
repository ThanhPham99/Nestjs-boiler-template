import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly user_service: UserService) {}

  @Post()
  create(@Body() create_user_dto: CreateUserDto) {
    return this.user_service.create(create_user_dto);
  }

  @Get()
  findAll() {
    return this.user_service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.user_service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() update_user_dto: UpdateUserDto) {
    return this.user_service.update(+id, update_user_dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.user_service.remove(+id);
  }
}
