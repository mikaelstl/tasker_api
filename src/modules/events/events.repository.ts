import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { EventCreateDTO } from "@modules/events/dto/event.create.dto";
import { EventDTO } from "@modules/events/dto/event.dto";
import { EventQueryDTO } from "@modules/events/dto/event.query.dto";

@Injectable()
export class EventsRepository {
  constructor (
    // @InjectModel(Checkpoint) private readonly Checkpoints: typeof Checkpoint
    private readonly prisma: PrismaService
  ) {}

  async create(data: EventCreateDTO): Promise<EventDTO> {
    try {
      const event = await this.prisma.event.create({
        data: {
          title: data.title,
          date: data.date,
          projectkey: data.project,
          category: data.category
        }
      });

      return event;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async list(queries: EventQueryDTO): Promise<EventDTO[]> {
    try {
      const events = await this.prisma.event.findMany({
        where: queries,
        /* include: [
          {
            model: 
          }
        ] */
      });

      return events;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async find(id: string) {
    try {
      const event = await this.prisma.event.findUnique({
        where: {
          id: id
        }
      });

      if (!event) {
        throw new NotFoundException();
      }

      return event;
    } catch (err: any) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async edit(id: string, update: any): Promise<any> {
    try {
      const response = await this.prisma.event.update({
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

  async delete(key: string): Promise<any> {
    try {
      const result = await this.prisma.event.delete({
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