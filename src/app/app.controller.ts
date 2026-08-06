import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiResponse } from 'src/common/interfaces/ApiResponse';
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
      path: '/api/v1/status'
    };

    return res.status(response.status).json(response);
  }
}
