import { BadRequestException, Injectable, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { Order, PaymentStatus } from 'src/schema/order.schema';
import { Enrollment } from 'src/schema/enrollment.schema';
import { Course } from 'src/schema/course.schema';
import { User } from 'src/schema/student.schema';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    this.stripe = new Stripe(configService.get<string>('STRIPE_CREDENTIALS')!);
  }

  // ─── Create Checkout Session ─────────────────────────────────────────────────

  async createCheckoutSession(courses: any[], userId: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    // Create pending orders for each course before redirect
    const orderIds: string[] = [];
    for (const course of courses) {
      const courseDoc = await this.courseModel.findById(course._id).populate('courseProvider');
      if (!courseDoc) continue;

      const order = await this.orderModel.create({
        userId,
        courseId: courseDoc._id,
        providerId: courseDoc.courseProvider,
        amount: course.price || 0,
        paymentStatus: PaymentStatus.PENDING,
      });
      orderIds.push((order._id as any).toString());
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: courses.map((course) => ({
        price_data: {
          currency: 'inr',
          product_data: { name: course.title },
          unit_amount: Number(course.price || 0) * 100,
        },
        quantity: 1,
      })),
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancel`,
      metadata: {
        userId,
        orderIds: orderIds.join(','),
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  // ─── Stripe Webhook ──────────────────────────────────────────────────────────

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured.');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.handleCheckoutSuccess(session);
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.handleCheckoutFailed(session);
    }

    return { received: true };
  }

  private async handleCheckoutSuccess(session: Stripe.Checkout.Session) {
    const { userId, orderIds } = session.metadata || {};
    if (!userId || !orderIds) return;

    const ids = orderIds.split(',').filter(Boolean);

    for (const orderId of ids) {
      const order = await this.orderModel.findByIdAndUpdate(
        orderId,
        {
          paymentStatus: PaymentStatus.SUCCESS,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string,
        },
        { new: true },
      );

      if (order) {
        // Enroll user in course
        const existing = await this.enrollmentModel.findOne({
          userId: order.userId,
          courseId: order.courseId,
        });
        if (!existing) {
          await this.enrollmentModel.create({
            userId: order.userId,
            courseId: order.courseId,
            isUniversityStudent: false,
          });
        }
      }
    }
  }

  private async handleCheckoutFailed(session: Stripe.Checkout.Session) {
    const { orderIds } = session.metadata || {};
    if (!orderIds) return;
    const ids = orderIds.split(',').filter(Boolean);
    await this.orderModel.updateMany(
      { _id: { $in: ids } },
      { paymentStatus: PaymentStatus.FAILED, stripeSessionId: session.id },
    );
  }

  // ─── Payment Intent (alternative flow) ──────────────────────────────────────

  async createPaymentIntent(amount: number, currency: string = 'inr') {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount * 100,
      currency,
      payment_method_types: ['card'],
    });
    return { clientSecret: paymentIntent.client_secret };
  }
}
