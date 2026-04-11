import { ApiResponse } from "@interfaces/ApiResponse";
import { Body, Controller, Delete, Get, Headers, HttpException, HttpStatus, Param, Post, Put, Query, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../../security/auth.guard";
import { UploadService } from "@modules/upload/upload.service";
import { CreateCommentDTO } from "@modules/comments/dto/comment.create.dto";
import { CommentQueryDTO } from "@modules/comments/dto/comment.query.dto";

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
          new HttpException('Only upload images.', HttpStatus.BAD_REQUEST),
          false
        );
      }

      callback(null, true);
    }
  }))
  async upload(
    @UploadedFile() image: Express.Multer.File,
    @Headers('User') user: string,
    @Res() response
  ) {
    const result = await this.service.upload(image, user); 
    
    const resp: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Added image with success',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/upload/image'
    };

    return response.status(resp.status).json(resp);
  }

  /* @Get()
  async list(
    @Query() queries: CommentQueryDTO,
    @Res() response
  ) {
    const result = await this.service.list(queries);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/comments'
    };
    
    return response.status(resp.status).json(resp);
  } */
}