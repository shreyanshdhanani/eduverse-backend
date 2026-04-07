import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { UniversityRegistrationDto } from './university.dto';
import { InjectModel } from '@nestjs/mongoose';
import { University } from 'src/schema/university.schema';
import { Model } from 'mongoose';
import { MailerService } from '@nestjs-modules/mailer';

import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import { Subscription } from 'src/schema/university-subscription.schema';
import { JwtService } from '@nestjs/jwt';
import { StudentService } from '../student/student.service';

@Injectable()
export class UniversityAdminService {
    constructor(@InjectModel(University.name) private universityModel: Model<University>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    @InjectModel('Enrollment') private enrollmentModel: Model<any>,
    private mailService: MailerService,
    private studentService: StudentService,
    private readonly jwtService: JwtService) {}

    async findUniversityByEmail(email: string)
    {
        return await this.universityModel.findOne({email: email})
    }
    async universityRegistration(universityRegistrationDto: UniversityRegistrationDto) {
        // Check if the university with the same email already exists
        const existingUniversity = await this.universityModel.findOne({
            email: universityRegistrationDto.email
        });

        if (existingUniversity) {
            throw new BadRequestException('University with this email already exists.');
        }

        try {
            // Create the new university if no duplicate email is found
            const university = await this.universityModel.create(universityRegistrationDto);
            if (university._id) {
                return university; // Return the created university document
            } else {
                throw new BadRequestException('Error while registering university');
            }
        } catch (error) {
            // Handle any other errors, e.g., database issues
            throw new BadRequestException('Error while registering university: ' + error.message);
        }
    }

    async getAll() {
        const universities = await this.universityModel.find().lean();
        const activeSubs = await this.subscriptionModel.find({ isActive: true }).lean();
        
        const subsMap = new Map();
        activeSubs.forEach(sub => subsMap.set(sub.university.toString(), sub));

        return universities.map(u => ({
            ...u,
            activeSubscription: subsMap.get(u._id.toString()) || null
        }));
    }

    async changeStatus(id,status)
    {

        const updateStatus = await this.universityModel.findByIdAndUpdate(id,{approvalStatus: status})
        if(status =="Approved")
        {
            const university = await this.universityModel.findById(id)
            if(university?._id)
            {
                try {
                    await this.mailService.sendMail({
                        to: university.email,
                        subject: 'Welcome to Our Platform!',
                        template: 'university-approval',
                        context: {
                                    universityName:university.universityName,
                                    email: university.email,
                                    contactNumber: university.contactNumber,
                                    website: "werdfgbvcx",
                                    dashboardLink: "sadfghj"
                         }
                    });
                    console.log(`✅ University approval email sent to: ${university.email}`);
                } catch (mailError) {
                    console.error(`❌ Failed to send university approval email to ${university.email}:`, mailError);
                }
            }
           
        }
        return updateStatus
    }

    // @deprecated — subscription assignment is now handled by /subscription-plans/assign
    async getSubscription(id: string, planName: string) {
        const university = await this.universityModel.findById(id);
        if (!university?._id) {
            throw new BadRequestException('University not found');
        }
        return { message: 'Use the subscription-plans/assign endpoint to assign plans to universities.' };
    }

    
    async findByEmail(email: string) {
        return this.universityModel.findOne({ email });
      }
    async countUniversity()
    {
        return this.universityModel.countDocuments()
    }

    async countPendingUniversities()
    {
        return this.universityModel.countDocuments({approvalStatus: 'Pending'})
    }
    async countApprovedUniversities()
    {
        return this.universityModel.countDocuments({approvalStatus: 'Approved'})
    }

    async countRejectedUniversities()
    {
        return this.universityModel.countDocuments({approvalStatus: 'Rejected'})
    }

    async getAllStudentsByUniversity(token)
    {
        const decoded = await this.jwtService.verify(token)
        const university = await this.findUniversityByEmail(decoded.email)
        return this.studentService.getStudentByUniversity(university)
    }

    async uploadStudents(students, universityId) {
        const decoded = await this.jwtService.verify(universityId);
        const university = await this.findUniversityByEmail(decoded.email);
        
        // CHECK SEATS REMAINING
        const usage = await this.getSubscriptionUsage(universityId);
        const seatsRemaining = usage.seatsRemaining ?? 0;
        if (usage.hasSubscription && students.length > seatsRemaining) {
            throw new Error(`Insufficient seats. You only have ${seatsRemaining} seats left.`);
        }

        const userPromises = students.map(async (student) => {
            const newUser = {
                name: student.name,
                email: student.email,
                universityId: university,
                password: 'password@123',
                mustChangePassword: true,
            };
            const newStudent = await this.studentService.createStudent(newUser);
            
            // Send Invitation Email
            try {
                await this.mailService.sendMail({
                    to: newStudent.email,
                    subject: 'Welcome to EduVerse - Your Learning Platform',
                    template: 'invitation-mail',
                    context: {
                        studentName: newStudent.name,
                        studentEmail: newStudent.email
                    }
                });
            } catch (mailError) {
                console.error(`❌ Failed to send student invitation email to ${newStudent.email}:`, mailError);
            }
            
            return newStudent;
        });
        
        return Promise.all(userPromises);
    }

    async addStudentManual(dto: any) {
        const { name, email, password, universityToken } = dto;
        const decoded = await this.jwtService.verify(universityToken);
        const university = await this.findUniversityByEmail(decoded.email);

        // CHECK SEATS REMAINING
        const usage = await this.getSubscriptionUsage(universityToken);
        const seatsRemaining = usage.seatsRemaining ?? 0;
        if (usage.hasSubscription && seatsRemaining <= 0) {
            throw new Error('No seats remaining in your current subscription plan.');
        }

        const newUser = {
            name,
            email,
            password: password || 'password@123',
            universityId: university,
            mustChangePassword: true,
        };

        const newStudent = await this.studentService.createStudent(newUser);

        // Send Invitation Email
        try {
            await this.mailService.sendMail({
                to: newStudent.email,
                subject: 'Welcome to EduVerse - Your Learning Platform',
                template: 'invitation-mail',
                context: {
                    studentName: newStudent.name,
                    studentEmail: newStudent.email
                }
            });
        } catch (mailError) {
            console.error(`❌ Failed to send student invitation email to ${newStudent.email}:`, mailError);
        }

        return newStudent;
    }

    async generateUniversityPDF(): Promise<string> {
        const universities = await this.universityModel.find();
        if (!universities.length) {
          throw new NotFoundException("No universities found");
        }
    
        const pdfPath = path.join(__dirname, "..", "..", "..", "upload", "universities.pdf");
        
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument();
            const writeStream = fs.createWriteStream(pdfPath);
            
            doc.pipe(writeStream);

            // Title
            doc.fontSize(24).fillColor('#000000').text('E', { continued: true });
            doc.fillColor('#9333ea').text('duverse', { continued: false });
            doc.fontSize(20).fillColor('#000000').text('University List', { align: 'center' });
            doc.moveDown();

            // Table Header
            const startX = 50;
            let startY = doc.y;
            const columnWidths = [150, 150, 100, 100];
            
            doc.fontSize(12).fillColor('white').rect(startX, startY, 500, 20).fill('#007bff');
            doc.fillColor('white');
            doc.text('University Name', startX + 5, startY + 5);
            doc.text('Email', startX + 155, startY + 5);
            doc.text('Contact', startX + 305, startY + 5);
            doc.text('Status', startX + 405, startY + 5);
            
            startY += 20;

            // Table Rows
            doc.fillColor('black');
            universities.forEach((university, index) => {
                // Alternating background
                if (index % 2 === 0) {
                    doc.rect(startX, startY, 500, 20).fill('#f9f9f9');
                }
                
                doc.fillColor('black');
                doc.text(university.universityName || '', startX + 5, startY + 5, { width: 140, height: 15, ellipsis: true });
                doc.text(university.email || '', startX + 155, startY + 5, { width: 140, height: 15, ellipsis: true });
                doc.text(university.contactNumber || '', startX + 305, startY + 5, { width: 90, height: 15, ellipsis: true });
                doc.text(university.approvalStatus || '', startX + 405, startY + 5, { width: 90, height: 15, ellipsis: true });
                
                startY += 20;

                // Add pagination if needed
                if (startY > 700) {
                    doc.addPage();
                    startY = 50;
                }
            });

            // Footer
            doc.fontSize(10).fillColor('#666666').text(
                `Generated on: ${new Date().toLocaleString()} | © 2025 EduVerse Ltd.`,
                50, 
                startY + 20, 
                { align: 'center' }
            );

            doc.end();

            writeStream.on('finish', () => resolve(pdfPath));
            writeStream.on('error', (err) => reject(err));
        });
      }
    
    async getDashboardStats(token: string) {
        const decoded = await this.jwtService.verify(token);
        const university = await this.findUniversityByEmail(decoded.email);
        if (!university) throw new NotFoundException('University not found');

        const totalStudents = await this.studentService.countStudentsByUniversity(university);
        const subscription = await this.subscriptionModel.findOne({ university: university._id });
        
        // Count students from this university who are enrolled in at least one course
        const students = await this.studentService.getStudentByUniversity(university);
        const studentIds = students.map(s => s._id);
        const enrolledCount = await this.enrollmentModel.countDocuments({ userId: { $in: studentIds } });

        return {
            totalStudents,
            enrolledCount,
            subscriptionPlan: subscription?.planName || 'No Active Plan',
            subscriptionDetails: subscription ? {
                maxStudents: subscription.maxStudents,
                maxCoursesPerStudent: subscription.maxCoursesPerStudent
            } : null,
            universityName: university.universityName,
            approvalStatus: university.approvalStatus
        };
    }

    async getProfile(token: string) {
        const decoded = await this.jwtService.verify(token);
        const university = await this.universityModel.findOne({ email: decoded.email }).select('-password');
        if (!university) throw new NotFoundException('University not found');
        return university;
    }

    async updateProfile(token: string, updateData: any) {
        const decoded = await this.jwtService.verify(token);
        const university = await this.universityModel.findOneAndUpdate(
            { email: decoded.email },
            { $set: updateData },
            { new: true }
        ).select('-password');
        
        if (!university) throw new NotFoundException('University not found');
        return university;
    }

    async getEnrolledStudents(token: string) {
        const decoded = await this.jwtService.verify(token);
        const university = await this.findUniversityByEmail(decoded.email);
        if (!university) throw new NotFoundException('University not found');

        const students = await this.studentService.getStudentByUniversity(university);
        const studentIds = students.map(s => s._id);

        return this.enrollmentModel.find({ userId: { $in: studentIds } })
            .populate('userId', 'name email freeCoursesUsed mustChangePassword')
            .populate('courseId', 'title thumbnail');
    }

    async getActiveSubscription(token: string) {
        const decoded = await this.jwtService.verify(token);
        const university = await this.findUniversityByEmail(decoded.email);
        if (!university) throw new NotFoundException('University not found');

        console.log(`[FORENSIC] [UniversityAdminService] Checking active sub for: ${university.universityName} (${university.email}) ID: ${university._id}`);

        const subscription = await this.subscriptionModel.findOne({ university: university._id });
        if (!subscription) {
            console.warn(`[FORENSIC] [UniversityAdminService] No record found in Subscription collection for university ID: ${university._id}`);
            return { hasSubscription: false, message: 'No active subscription. Please contact admin.' };
        }

        const now = new Date();
        const isExpired = subscription.endDate && now > subscription.endDate;
        const daysRemaining = subscription.endDate
            ? Math.max(0, Math.ceil((subscription.endDate.getTime() - now.getTime()) / 86400000))
            : null;

        return {
            hasSubscription: true,
            planName: subscription.planName,
            price: subscription.price,
            maxStudents: subscription.maxStudents,
            maxCoursesPerStudent: subscription.maxCoursesPerStudent,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            daysRemaining,
            isActive: subscription.isActive && !isExpired,
        };
    }

    async getSubscriptionUsage(token: string) {
        const decoded = await this.jwtService.verify(token);
        const university = await this.findUniversityByEmail(decoded.email);
        if (!university) throw new NotFoundException('University not found');

        console.log(`[FORENSIC] [UniversityAdminService] Checking sub usage for: ${university.universityName} ID: ${university._id}`);

        const subscription = await this.subscriptionModel.findOne({ university: university._id });
        if (!subscription) {
            console.warn(`[FORENSIC] [UniversityAdminService] No record found during usage check for university ID: ${university._id}`);
            return { hasSubscription: false };
        }

        const students = await this.studentService.getStudentByUniversity(university);
        const studentsAdded = students.length;
        const studentIds = students.map(s => s._id);

        const totalEnrolled = await this.enrollmentModel.countDocuments({
            userId: { $in: studentIds },
            isUniversityStudent: true,
        });

        const totalFreeCoursesUsed = students.reduce((sum, s: any) => sum + (s.freeCoursesUsed || 0), 0);

        return {
            hasSubscription: true,
            studentsAdded,
            seatsRemaining: Math.max(0, subscription.maxStudents - studentsAdded),
            maxStudents: subscription.maxStudents,
            maxCoursesPerStudent: subscription.maxCoursesPerStudent,
            totalEnrolled,
            totalFreeCoursesUsed,
        };
    }
}