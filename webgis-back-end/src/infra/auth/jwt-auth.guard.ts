import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public';
import { Observable, catchError, of } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const canActivate = super.canActivate(context);
      if (canActivate instanceof Observable) {
        return canActivate.pipe(catchError(() => of(true)));
      } else if (canActivate instanceof Promise) {
        return canActivate.catch(() => true);
      } else {
        return true;
      }
    }

    return super.canActivate(context);
  }
}
