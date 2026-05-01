import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { AuthService } from "./auth.service";
import { SECRET } from "src/config/env.config";
import { JWTPayload } from "src/common/interfaces/JWTPayload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly auth: AuthService){
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: SECRET
    })
  }

  validate(payload: JWTPayload) {
    return { account: payload.sub, username: payload.username }
  }
}