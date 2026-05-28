import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { EmailService, EmailLog } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';

@ApiTags('Email')
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'email', version: '1' })
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('logs')
  @ApiOkResponse()
  getLogs(): { data: EmailLog[] } {
    return { data: this.emailService.getLogs() };
  }

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse()
  async send(@Body() dto: SendEmailDto): Promise<EmailLog> {
    return this.emailService.send(dto.to, dto.subject, dto.body);
  }
}
