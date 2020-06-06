import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getStatus(@Res() res: Response) {
    return res.status(HttpStatus.OK).json(this.appService.getStatus());
  }
}
