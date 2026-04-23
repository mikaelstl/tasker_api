import { ApiResponse } from "@interfaces/ApiResponse";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Response } from "express";
import { Observable, catchError, map } from "rxjs";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    
    return next.handle().pipe(
      map(
        (response) => {
          return {
            status: response.statusCode,
            data: response.data,
            path: response.url
          }
        }
      )
    );
  }
}