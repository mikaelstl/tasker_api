import { ApiResponse as ApiResponse } from "src/common/interfaces/ApiResponse";
import { Headers, HttpStatus, Post, Res, UploadedFile, UseGuards, UseInterceptors, Controller } from '@nestjs/common';
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../../security/auth.guard";
import { UploadService } from "@modules/upload/upload.service";
import { CreateCommentDTO } from "@modules/comments/dto/comment.create.dto";
import { CommentQueryDTO } from "@modules/comments/dto/comment.query.dto";
import { ValidationException } from 'src/common/errors/validation.exception';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor (
    private readonly service: UploadService
  ) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image', {
    fileFilter: (_, file, callback) => {
      if (!file.mimetype.startsWith('image/')) {
        return callback(
          new ValidationException('Envie apenas arquivos de imagem.'),
          false
        );
      }

      callback(null, true);
    }
  }))
  async upload(
    @UploadedFile() image: Express.Multer.File,
    @Headers('User') user: string,
    @Res() res
  ) {
    const result = await this.service.upload(image, user); 
    
    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Imagem adicionada com sucesso.',
      
      timestamp: new Date().toISOString(),
      path: '/upload/image'
    };

    return res.status(res.status).json(response);
  }

  /* @Get()
  async list(
    @Query() queries: CommentQueryDTO,
    @Res() res
  ) {
    const result = await this.service.list(queries);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/comments'
    };
    
    return res.status(res.status).json(response);
  } */
}
