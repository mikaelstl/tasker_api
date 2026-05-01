import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { CreateCommentDTO } from "@modules/comments/dto/comment.create.dto";
import { CommentDTO } from "@modules/comments/dto/comment.dto";
import { CommentQueryDTO } from "@modules/comments/dto/comment.query.dto";

@Injectable()
export class CommentsRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: CreateCommentDTO): Promise<CommentDTO> {
    const comment = await this.prisma.comment.create({
      data: {
        content: data.content,
        date: data.date,
        projectkey: data.projectkey,
        ownerkey: data.ownerkey
      }
    });

    return comment;
  }

  async list(queries: CommentQueryDTO): Promise<CommentDTO[]> {
    const comments = await this.prisma.comment.findMany({
      where: queries,
    });

    return comments;
  }

  async find(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: id
      }
    });

    if (!comment) {
      throw new NotFoundException();
    }

    return comment;
  }

  async edit(id: string, update: any): Promise<CommentDTO> {
    const response = await this.prisma.comment.update({
      data: update,
      where: {
        id: id
      }
    });

    return response;
  }

  async delete(key: string): Promise<CommentDTO> {
    const result = await this.prisma.comment.delete({
      where: {
        id: key
      }
    });

    if (!result) {
      throw new NotFoundException();
    }

    return result;
  }

  async exists(key: string, query: CommentQueryDTO): Promise<boolean> {
    const result = await this.prisma.comment.count({
      where: {
        id: key,
        ...query
      }
    });

    return result > 0;
  }
}