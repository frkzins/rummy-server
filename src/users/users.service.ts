import { Injectable } from '@nestjs/common';
import { User } from './user.interface';

import * as _ from 'lodash';

@Injectable()
export class UsersService {
    private readonly users: User[] = [];

    create(user: User): User {
        user.id = this.users.length;
        this.users.push(user);
        return user
    }

    findAll(): User[] {
        return this.users;
    }

    findOne(id: Number): User {
        return _.find(this.users, u => { return (u.id === +id) });
    }

    delete(id: Number) {
        _.remove(this.users, u => { return (u.id === +id) });
    }
}
