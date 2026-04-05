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
    console.log(`Fetching cart for user: ${userId}`);
    const cartItems = await this.cartModel.find({ userId }).populate('courseId');
    
    // Filter out items where the course no longer exists in the Courses collection
    const courses = cartItems
      .filter((item) => item.courseId !== null)
      .map((item) => item.courseId);
      
    console.log(`Found ${courses.length} active courses in cart.`);
    return { courses };
  }
  
  async addCourseToCart(userId: string, courseId: string) {
    console.log(`Adding course ${courseId} to cart for user ${userId}`);
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    // Allowing university students to add to cart for tracking/purchasing non-university courses
    if (user.universityId) {
      console.log(`User ${userId} is a university student. Allowing cart add with info message.`);
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
    return { 
      message: user.universityId 
        ? 'Course added to cart. As a university student, you may also enroll for free.'
        : 'Course added to cart successfully.', 
      status: 'added_to_cart' 
    };
  }

  async removeCourseFromCart(userId: string, courseId: string) {
    console.log(`Removing course ${courseId} from cart for user ${userId}`);
    await this.cartModel.deleteOne({ userId, courseId });
    return { message: 'Course removed from cart.' };
  }
}
