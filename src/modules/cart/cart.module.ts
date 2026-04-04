import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Course, CourseSchema } from 'src/schema/course.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schema/student.schema';
import { Cart, CartSchema } from 'src/schema/cart.schema';
import { Enrollment, EnrollmentSchema } from 'src/schema/enrollment.schema';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
