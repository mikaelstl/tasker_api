import { Resource } from '@decorators/Resource';
import { Role } from '@decorators/Role';
import { Resources } from '@enums/Resources.enum';
import { PermissionGuard } from '@guards/permission.guard';
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@security/auth.guard';
import { OrgRole } from 'generated/prisma';

