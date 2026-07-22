import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiResponse as ApiResponse } from 'src/common/interfaces/ApiResponse';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly service: AppService) {}

  @Get("status")
  status(@Res() res) {
    const result = this.service.status();

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'API disponível.',
      timestamp: new Date().toISOString(),
      path: '/status'
    };

    return res.status(res.status).json(response);
  }
}
