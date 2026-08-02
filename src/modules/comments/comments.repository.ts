import { Injectable } from '@nestjs/common';
import { CommentNotFoundException } from 'src/common/errors/resource-not-found.exceptions';
import { PrismaService } from "src/database/prisma.service";
import { Prisma } from "generated/prisma";
import { CreateCommentDTO } from "@modules/comments/dto/comment.create.dto";
import { CommentDTO } from "@modules/comments/dto/comment.dto";
import { CommentQueryDTO } from "@modules/comments/dto/comment.query.dto";

@Injectable()
export class CommentsRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: CreateCommentDTO, memberkey: string): Promise<CommentDTO> {
    const comment = await this.prisma.comment.create({
      data: {
        content: data.content,
        date: data.date,
        projectkey: data.projectkey,
        ownerkey: memberkey,
      }
    });

    return comment;
  }

  async findMemberByUserAndProject(userkey: string, projectkey: string) {
    return this.prisma.member.findFirst({
      where: {
        projectkey,
        user: { userkey },
      },
      select: { id: true },
    });
  }

  async list(queries: CommentQueryDTO): Promise<CommentDTO[]> {
    const comments = await this.prisma.comment.findMany({
      where: queries,
      include: {
        owner: true
      }
    });

    return comments;
  }

  async find(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: id
      },
      include: {
        owner: true
      }
    });

    if (!comment) {
      throw new CommentNotFoundException();
    }

    return comment;
  }

  async edit(id: string, update: any): Promise<CommentDTO> {
    const response = await this.prisma.comment.update({
      data: update,
      where: {
        id: id
      },
      include: {
        owner: true
      }
    });

    return response;
  }

  async delete(key: string): Promise<CommentDTO> {
    const result = await this.prisma.comment.delete({
      where: {
        id: key
      },
      include: {
        owner: true
      }
    });

    if (!result) {
      throw new CommentNotFoundException();
    }

    return result;
  }

  async exists(key: string, query: Prisma.CommentWhereInput): Promise<boolean> {
    const result = await this.prisma.comment.count({
      where: {
        id: key,
        ...query
      }
    });

    return result > 0;
  }
}
