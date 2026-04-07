import { BadRequestException, Injectable, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { Order, PaymentStatus } from 'src/schema/order.schema';
import { Enrollment } from 'src/schema/enrollment.schema';
import { Course } from 'src/schema/course.schema';
import { User } from 'src/schema/student.schema';
import { Cart } from 'src/schema/cart.schema';
import { SubscriptionPlan } from 'src/schema/subscription-plan.schema';
import { Subscription } from 'src/schema/university-subscription.schema';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(SubscriptionPlan.name) private planModel: Model<SubscriptionPlan>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
  ) {
    this.stripe = new Stripe(configService.get<string>('STRIPE_CREDENTIALS')!);
  }

  // ─── Create Checkout Session ─────────────────────────────────────────────────

  async createCheckoutSession(courses: any[], userId: string) {
    const frontendUrlRaw = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    // Handle comma-separated URLs in .env (common for multiple environments)
    const frontendUrl = frontendUrlRaw.split(',')[0].trim();

    // Create pending orders for each course before redirect
    const orderIds: string[] = [];
    for (const course of courses) {
      const courseDoc = await this.courseModel.findById(course._id).populate('courseProvider');
      if (!courseDoc) continue;

      const order = await this.orderModel.create({
        userId: new Types.ObjectId(userId),
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

  // ─── Create Subscription Checkout Session ───────────────────────────────────

  async createSubscriptionSession(planId: string, universityId: string) {
    // ─── CHECK FOR ACTIVE SUBSCRIPTION ─────────
    const existingSub = await this.subscriptionModel.findOne({ 
      university: universityId, 
      isActive: true, 
      endDate: { $gt: new Date() } 
    });
    if (existingSub) {
      throw new BadRequestException('You already have an active subscription plan');
    }

    const plan = await this.planModel.findById(planId);
    if (!plan) throw new BadRequestException('Subscription plan not found');

    const frontendUrlRaw = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const frontendUrl = frontendUrlRaw.split(',')[0].trim();

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: { 
            name: plan.planName,
            description: `University Subscription: ${plan.maxStudents} students, ${plan.maxCoursesPerStudent} courses per student`,
          },
          unit_amount: plan.price * 100, // Assuming price is in INR or USD * 100
        },
        quantity: 1,
      }],
      success_url: `${frontendUrl}/university/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/university/subscription?canceled=true`,
      metadata: {
        type: 'subscription_purchase',
        universityId,
        planId,
      },
    });

    console.log(`[FORENSIC] [StripeService] Created session ${session.id} for universityId: ${universityId}`);
    return { url: session.url, sessionId: session.id };
  }
  
  // ─── Verify Checkout Session ────────────────────────────────────────────────
  
  async verifySession(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status === 'paid') {
        const result = await this.handleCheckoutSuccess(session);
        return { success: true, ...result };
      }
      
      return { success: false, status: session.payment_status };
    } catch (error) {
      throw new BadRequestException(`Failed to verify session: ${error.message}`);
    }
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
    const { type, userId, orderIds, universityId, planId } = session.metadata || {};
    console.log(`[StripeService] Handling checkout success for stage: ${type}`);
    console.log(`[StripeService] Session metadata:`, session.metadata);

    if (type === 'subscription_purchase') {
      console.log('[StripeService] Detected subscription purchase - fulfilling...');
      return this.fulfillSubscription(session);
    }

    if (!userId || !orderIds) return;

    const ids = orderIds.split(',').filter(Boolean);

    for (const orderId of ids) {
      // Find order and check if it's already successful to avoid double processing
      const existingOrder = await this.orderModel.findById(orderId);
      if (!existingOrder || existingOrder.paymentStatus === PaymentStatus.SUCCESS) continue;

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
        const orderUserId = new Types.ObjectId(order.userId as any);
        const orderCourseId = new Types.ObjectId(order.courseId as any);

        // Robust lookup for enrollment
        let enrollment = await this.enrollmentModel.findOne({
          userId: orderUserId,
          courseId: orderCourseId,
        });

        if (!enrollment) {
          enrollment = await this.enrollmentModel.findOne({
            $or: [
              { userId: order.userId as any, courseId: order.courseId as any },
              { userId: order.userId as any, courseId: orderCourseId },
              { userId: orderUserId, courseId: order.courseId as any }
            ]
          });
        }

        if (!enrollment) {
          await this.enrollmentModel.create({
            userId: orderUserId,
            courseId: orderCourseId,
            isUniversityStudent: false,
          });
        }
      }
    }

    // After all orders processed, clear the user's cart
    if (userId) {
      await this.cartModel.deleteMany({ userId });
    }

    return { message: 'Orders processed and cart cleared' };
  }

  private async fulfillSubscription(session: Stripe.Checkout.Session) {
    const { universityId, planId } = session.metadata || {};
    console.log(`[FORENSIC] [StripeService] Starting fulfillment for session ${session.id}`);
    console.log(`[FORENSIC] [StripeService] Metadata universityId: ${universityId}`);
    console.log(`[FORENSIC] [StripeService] Metadata planId: ${planId}`);
    
    if (!universityId || !planId) {
      console.warn('[StripeService] Missing metadata in session');
      return;
    }

    const plan = await this.planModel.findById(planId);
    if (!plan) {
      console.warn(`[StripeService] Plan not found for planId: ${planId}`);
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 365); // Default 1 year

    try {
      const updated = await this.subscriptionModel.findOneAndUpdate(
        { university: new Types.ObjectId(universityId) },
        {
          university: new Types.ObjectId(universityId),
          planRef: new Types.ObjectId(planId),
          planName: plan.planName,
          maxStudents: plan.maxStudents,
          maxCoursesPerStudent: plan.maxCoursesPerStudent,
          startDate,
          endDate,
          isActive: true,
          stripeSessionId: session.id,
        },
        { upsert: true, new: true }
      );
      console.log(`[StripeService] Subscription record saved successfully: ${updated._id}`);
      return { message: 'Subscription fulfilled successfully', subscriptionId: updated._id };
    } catch (error) {
      console.error('[StripeService] Error saving subscription record:', error);
      throw error;
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
