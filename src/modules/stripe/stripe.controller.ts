import { Controller, Post, Body, Headers, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import { Request } from 'express';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Post('create-checkout-session')
  async createSession(@Body('cartCourses') cartCourses: any[], @CurrentUser() user: any) {
    return this.stripeService.createCheckoutSession(cartCourses, user._id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.UNIVERSITY)
  @Post('create-subscription-session')
  async createSubscriptionSession(@Body('planId') planId: string, @CurrentUser() user: any) {
    return this.stripeService.createSubscriptionSession(planId, user._id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.UNIVERSITY)
  @Post('verify-session')
  async verifySession(@Body('sessionId') sessionId: string) {
    return this.stripeService.verifySession(sessionId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Post('create-payment-intent')
  async createPaymentIntent(@Body('amount') amount: number) {
    return this.stripeService.createPaymentIntent(amount);
  }

  // Stripe webhook — NO auth guard, uses signature verification instead
  @Post('webhook')
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhook(req.rawBody!, signature);
  }
}
