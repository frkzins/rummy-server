import { Controller, Get, Post, Body, Param, Res, HttpStatus, Delete } from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './create-user.dto';
import { User } from './user.interface';
import * as _ from 'lodash';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Post()
    async create(@Body() createCatDto: CreateUserDto) {
        const user = this.usersService.create(createCatDto);
        return user;
    }

    @Get()
    async findAll(): Promise<User[]> {
        return this.usersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: Number, @Res() res: Response) {
        const user = this.usersService.findOne(id);
        if (!_.isNil(user)) {
            return res.status(HttpStatus.OK).json(user);
        }
        return res.status(HttpStatus.NOT_FOUND).json({});
    }

    @Delete(':id')
    delete(@Param('id') id: Number) {
        this.usersService.delete(id);
        return { id };
    }

}
