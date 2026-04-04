import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart } from 'src/schema/cart.schema';
import { Course } from 'src/schema/course.schema';
import { Enrollment } from 'src/schema/enrollment.schema';
import { User } from 'src/schema/student.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
  ) {}

  async getCartCourses(userId: string) {
    const cartItems = await this.cartModel.find({ userId }).populate('courseId');
    const courses = cartItems.map((item) => item.courseId);
    return { courses };
  }

  async addCourseToCart(userId: string, courseId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (user.universityId) {
      return {
        message: 'As a university student, you can enroll directly for free.',
        status: 'university_student',
      };
    }

    const alreadyEnrolled = await this.enrollmentModel.findOne({ userId, courseId });
    if (alreadyEnrolled) {
      return { message: 'You are already enrolled in this course.', status: 'already_enrolled' };
    }

    const alreadyInCart = await this.cartModel.findOne({ userId, courseId });
    if (alreadyInCart) {
      return { message: 'Course is already in your cart.', status: 'already_in_cart' };
    }

    await this.cartModel.create({ userId, courseId });
    return { message: 'Course added to cart successfully.', status: 'added_to_cart' };
  }

  async removeCourseFromCart(userId: string, courseId: string) {
    await this.cartModel.deleteOne({ userId, courseId });
    return { message: 'Course removed from cart.' };
  }
}
