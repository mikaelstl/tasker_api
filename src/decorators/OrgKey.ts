import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";

export const ORG_KEY = 'x-org-key';
export const OrgKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const orgkey = req.headers[ORG_KEY];

    console.log(orgkey);
    

    return orgkey;
  }
);