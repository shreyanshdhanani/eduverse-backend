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

    async getAll()
    {
        return await this.universityModel.find()
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

    async getSubscription(id, plan){
        const university = await this.universityModel.findById(id)
        if(university?._id)
        {
                const addSubscription = await this.subscriptionModel.findOneAndUpdate(
                { university: university }, // Search by university ID
                {
                  plan: plan,
                  startDate: new Date(),
                  endDate: new Date(new Date().setDate(new Date().getDate() + 30)), 
                },
                { upsert: true, new: true } // Create if not exists, return updated doc
              );
              
        }
        else{
            throw new BadRequestException('University not exists')
        }
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

    async uploadStudents(students, universityId){
    const decoded = await this.jwtService.verify(universityId)
    const university = await this.findUniversityByEmail(decoded.email)
     const userPromises = students.map(async(student) => {
        const newUser = {
          name: student.name,
          email: student.email,
          universityId:university, 
          password: 'password@123',
        };
        const newStudent = await this.studentService.createStudent(newUser); // Save student in the User model
        if(newStudent._id)
        {
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
                console.log(`✅ Student invitation email sent to: ${newStudent.email}`);
            } catch (mailError) {
                console.error(`❌ Failed to send student invitation email to ${newStudent.email}:`, mailError);
            }
        }
    });
    await Promise.all(userPromises);

    return { message: 'Students uploaded successfully' };  
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
            subscriptionPlan: subscription?.plan || 'No Active Plan',
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
            .populate('userId', 'name email')
            .populate('courseId', 'title thumbnailImage');
    }
}