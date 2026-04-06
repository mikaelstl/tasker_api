import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { CreateCommentDTO } from "@modules/comments/dto/comment.create.dto";
import { CommentDTO } from "@modules/comments/dto/comment.dto";
import { CommentQueryDTO } from "@modules/comments/dto/comment.query.dto";

@Injectable()
export class CommentsRepository {
  constructor (
    private readonly prisma: PrismaService
  ) {}

  async create(data: CreateCommentDTO): Promise<CommentDTO> {
    try {
      const comment = await this.prisma.comment.create({
        data: {
          content: data.content,
          date: data.date,
          projectkey: data.projectkey,
          ownerkey: data.ownerkey
        }
      });

      return comment;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async list(queries: CommentQueryDTO): Promise<CommentDTO[]> {
    try {
      const comments = await this.prisma.comment.findMany({
        where: queries,
      });

      return comments;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async find(id: string) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: {
          id: id
        }
      });

      if (!comment) {
        throw new NotFoundException();
      }

      return comment;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async edit(id: string, update: any): Promise<CommentDTO> {
    try {
      const response = await this.prisma.comment.update({
        data: update,
        where: {
          id: id
        }
      });
      
      return response;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(key: string): Promise<CommentDTO> {
    try {
      const result = await this.prisma.comment.delete({
        where: {
          id: key
        }
      });

      if (!result) {
        throw new NotFoundException();
      }

      return result;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}