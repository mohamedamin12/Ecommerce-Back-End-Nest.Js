
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Roles } from '../decorator/roles.decorator';
import { Reflector } from '@nestjs/core';


@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    const roles = this.reflector.get(Roles, context.getHandler());

    if (!roles) {
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: process.env.JWT_SECRET,
        }
      );
      if (payload._id && payload.role.toLowerCase() === 'admin') {
        request['user'] = payload;
        return true;
      }
      if (
        !payload.role ||
        payload.role === '' ||
        !roles.includes(payload.role)
      ) {
        throw new UnauthorizedException();
      }
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
