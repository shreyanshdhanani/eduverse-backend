import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from 'src/schema/course.schema';
import { Section } from 'src/schema/section.schema';

@Injectable()
export class CoursesService {
    constructor(@InjectModel(Course.name) private courseModel: Model<Course>){}
    
    async getAllCourses()
    {
        return await this.courseModel.find()
    }

    async getCourseDetails(id: string)
    {
        return await this.courseModel.findById(id)
        .populate("category", "name") 
        .populate("subcategory", "name")
        .populate("topic", "name")
        .populate("courseProvider")
    }

    // Add a new section to a course
  async addSection(courseId: string, section: Section): Promise<Course> {
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    course.sections.push(section);
    return course.save();
  }

  // Update an existing section
  async updateSection(courseId: string, sectionId: string, sectionData) {
    const course = await this.courseModel.findOneAndUpdate(
      { _id: courseId, 'sections._id': sectionId },
      {
        $set: {
          'sections.$.title': sectionData.title,
          'sections.$.description': sectionData.description,
        },
      },
      { new: true } // To return the updated document
    ).lean();  // Using lean to return plain objects
  
    if (!course) {
      throw new NotFoundException('Course or section not found');
    }
  
    return course;
  }
  // Delete a section
  async deleteSection(courseId: string, sectionId: string) {
    const course = await this.courseModel.findById(courseId);
    
    if (!course) {
      throw new NotFoundException('Course not found');
    }
  
    // Pull the section by _id from the sections array
    const updatedCourse = await this.courseModel.findByIdAndUpdate(
      courseId,
      { $pull: { sections: { _id: sectionId } } }, // Removes the section by _id
      { new: true } // To return the updated course document
    );
  
    if (!updatedCourse) {
      throw new NotFoundException('Section not found');
    }
  
    return updatedCourse; // Return the updated course with the section removed
  }
  
  async addVideo(courseId: string, sectionId: string, videoUrl: string) {
    const updatedCourse = await this.courseModel.findOneAndUpdate(
      { _id: courseId, 'sections._id': sectionId }, 
      {
        $push: { 'sections.$.videos': videoUrl }, 
      },
      { new: true } 
    ).lean();
  
    if (!updatedCourse) {
      throw new Error('Course or section not found.');
    }
  
    return updatedCourse; 
  }
  
  
}
