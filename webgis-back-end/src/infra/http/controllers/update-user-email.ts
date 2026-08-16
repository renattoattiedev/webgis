import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Req,
  UsePipes,
  Put,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { UpdateEmailUserUseCase } from '@/domain/security/application/use-cases/update-email-user';

const updateEmailBodySchema = z.object({
  email: z.string(),
});
const bodyValidationPipe = new ZodValidationPipe(updateEmailBodySchema);

type UpdateUserEmailBodySchema = z.infer<typeof updateEmailBodySchema>;

@Controller('/update-user-email')
export class UpdateUserEmailController {
  constructor(private updateEmailUserUseCase: UpdateEmailUserUseCase) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updateEmailBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: UpdateUserEmailBodySchema,
  ) {
    const user: UserPayload = request['user'];

    const id = user.sub;

    const { email: DSC_EMAIL } = body;

    try {
      await this.updateEmailUserUseCase.execute({
        COD_USER_ID: id,
        DSC_EMAIL,
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
