import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class QuizService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } else {
      console.warn('⚠️ GEMINI_API_KEY is missing. Quiz generation will not work.');
    }
  }

  async generateQuiz(title: string, description: string, level: string) {
    if (!this.genAI) {
      throw new InternalServerErrorException(
        'Gemini API key is missing. Please configure GEMINI_API_KEY in your .env file.',
      );
    }

    try {
      const prompt = `
        You are an expert educator. Generate a final exam for the following course:
        Course Title: ${title}
        Course Description: ${description}
        Difficulty Level: ${level}

        Requirements:
        1. Generate exactly 10 multiple-choice questions.
        2. Ensure the difficulty matches the "${level}" level.
        3. Base the questions strictly on the course title and description provided.
        4. Focus on core concepts and practical application.
        5. Format the response as a valid JSON array only.

        JSON structure:
        [
          {
            "question": "Clear, concise question text?",
            "options": ["Correct Answer", "Distractor 1", "Distractor 2", "Distractor 3"],
            "answer": "Correct Answer"
          }
        ]

        Important: Sort the options randomly in the array. 
        Only return the raw JSON array. No markdown, no "json" tags, no extra text.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      // Clean up markdown block if present
      if (text.startsWith('```')) {
        text = text.replace(/^```json|```$/g, '').trim();
      }

      const quizData = JSON.parse(text);
      
      if (!Array.isArray(quizData)) {
        throw new Error('Invalid quiz format received from Gemini.');
      }

      return quizData;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new InternalServerErrorException('Failed to generate course-specific exam: ' + error.message);
    }
  }
}
