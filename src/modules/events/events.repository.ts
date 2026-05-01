import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { EventCreateDTO } from "@modules/events/dto/event.create.dto";
import { EventDTO } from "@modules/events/dto/event.dto";
import { EventQueryDTO } from "@modules/events/dto/event.query.dto";

@Injectable()
export class EventsRepository {
  constructor(
    // @InjectModel(Checkpoint) private readonly Checkpoints: typeof Checkpoint
    private readonly prisma: PrismaService
  ) { }

  async create(data: EventCreateDTO): Promise<EventDTO> {
    const event = await this.prisma.event.create({
      data: {
        title: data.title,
        date: data.date,
        projectkey: data.project,
        category: data.category
      }
    });

    return event;
  }

  async list(queries: EventQueryDTO): Promise<EventDTO[]> {
    const events = await this.prisma.event.findMany({
      where: queries,
      /* include: [
        {
          model: 
        }
      ] */
    });

    return events;
  }

  async find(id: string) {
    const event = await this.prisma.event.findUnique({
      where: {
        id: id
      }
    });

    if (!event) {
      throw new NotFoundException();
    }

    return event;
  }

  async edit(id: string, update: any): Promise<any> {
    const response = await this.prisma.event.update({
      data: update,
      where: {
        id: id
      }
    });

    return response;
  }

  async delete(key: string): Promise<any> {
    const result = await this.prisma.event.delete({
      where: {
        id: key
      }
    });

    if (!result) {
      throw new NotFoundException();
    }

    return result;
  }

  async exists(key: string, query: EventQueryDTO): Promise<boolean> {
    const result = await this.prisma.task.count({
      where: {
        id: key,
        ...query
      }
    });

    return result > 0;
  }
}