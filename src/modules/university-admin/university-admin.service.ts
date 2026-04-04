import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { UniversityRegistrationDto } from './university.dto';
import { InjectModel } from '@nestjs/mongoose';
import { University } from 'src/schema/university.schema';
import { Model } from 'mongoose';
import { MailerService } from '@nestjs-modules/mailer';

import * as fs from 'fs';
import * as path from 'path';
import * as pdf from 'html-pdf-node';
import { Subscription } from 'src/schema/university-subscription.schema';
import { JwtService } from '@nestjs/jwt';
import { StudentService } from '../student/student.service';

@Injectable()
export class UniversityAdminService {
    constructor(@InjectModel(University.name) private universityModel: Model<University>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
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
                await this.mailService.sendMail({
                    to: university.email,
                    subject: 'Welcome to Our Platform!',
                    template: '../public/templates/university-approval',
                    context: {
                                universityName:university.universityName,
                                email: university.email,
                                contactNumber: university.contactNumber,
                                website: "werdfgbvcx",
                                dashboardLink: "sadfghj"
                     }
                });
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
            await this.mailService.sendMail({
                to: newStudent.email,
                subject: 'Welcome to EduVerse - Your Learning Platform',
                template: '../public/templates/invitation-mail',
                context: {
                    studentName: newStudent.name,
                    studentEmail: newStudent.email
                }
            });
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
    
        // ✅ Define the path to save the PDF
        const pdfPath = path.join(__dirname, "..", "..", "..", "upload", "universities.pdf");
    
        // ✅ Generate Table Rows Dynamically
        const tableRows = universities
          .map(
            (university, index) => `
              <tr style="background-color: ${index % 2 === 0 ? "#f9f9f9" : "#ffffff"};">
                  <td>${university.universityName}</td>
                  <td>${university.email}</td>
                  <td>${university.contactNumber}</td>
                  <td>${university.approvalStatus}</td>
              </tr>`
          )
          .join("");
    
        // ✅ Full HTML with Professional Design
        const html = `
          <html>
              <head>
                  <style>
                      body { font-family: 'Arial', sans-serif; padding: 20px; background-color: #f4f6f9; }
                      .container { max-width: 800px; margin: auto; background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                      h1 { text-align: center; color: #2a2a2a; font-size: 24px; margin-bottom: 10px; }
                      .header { display: flex; justify-content: space-between; align-items: center; }
                      .header img { width: 120px; }
                      .footer { text-align: center; font-size: 12px; margin-top: 20px; color: #666; }
                      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                      th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                      th { background-color: #007bff; color: white; font-weight: bold; }
                      tr:hover { background-color: #f1f1f1; }
                  </style>
              </head>
              <body>
                  <div class="container">
                      <div class="header">
                          <h1 style="font-size: 24px; font-weight: bold;">
                               <span style="color: black; display: inline-block; margin-right: -2px;">E</span>
                                <span style="color: #9333ea;">duverse</span>

                            </h1>
                          <h1>University List</h1>
                      </div>
                      <table>
                          <tr>
                              <th>University Name</th>
                              <th>Email</th>
                              <th>Contact</th>
                              <th>Status</th>
                          </tr>
                          ${tableRows}
                      </table>
                      <div class="footer">
                          Generated on: ${new Date().toLocaleString()} | © 2025 EduVerse Ltd.
                      </div>
                  </div>
              </body>
          </html>`;
    
        // ✅ Convert HTML to PDF and Save
        const file = { content: html };
        await pdf.generatePdf(file, { format: "A4" }).then((buffer) => {
          fs.writeFileSync(pdfPath, buffer);
        });
    
        return pdfPath;
      }
    
}