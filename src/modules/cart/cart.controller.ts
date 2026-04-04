import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCartCourses(@CurrentUser() user: any) {
    return this.cartService.getCartCourses(user._id);
  }

  @Post('add/:courseId')
  async addToCart(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.cartService.addCourseToCart(user._id, courseId);
  }

  @Delete('remove/:courseId')
  async removeFromCart(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.cartService.removeCourseFromCart(user._id, courseId);
  }
}
