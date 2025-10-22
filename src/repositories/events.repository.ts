import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { EventCreateDTO } from "src/DTO/events/event.create.dto";
import { EventDTO } from "src/DTO/events/event.dto";
import { EventQueryDTO } from "src/DTO/events/event.query.dto";
import { TaskQueryDTO } from "src/DTO/task/task.query.dto";

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
          projectkey: data.project
        }
      });

      return event;
    } catch (err) {
      throw new BadRequestException(err);
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
    } catch (err) {
      throw new BadRequestException(err);
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
    } catch (err) {
      throw new BadRequestException(err);
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
    } catch (err) {
      throw new BadRequestException(err);
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
    } catch (err) {
      throw new BadRequestException(err);
    }
  }
}