import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class QuizService {
    private openai: OpenAI;

    constructor(private readonly configService: ConfigService) {
      const apiKey = configService.get<string>('GPT_AI_API');
      if (apiKey) {
        this.openai = new OpenAI({ apiKey });
      } else {
        console.warn('⚠️ GPT_AI_API key is missing. Quiz generation will not work.');
      }
    }
  
    async generateQuiz(topic: string) {
      if (!this.openai) {
        throw new Error('OpenAI API key is missing. Please configure GPT_AI_API in your .env file.');
      }
      try {
          const prompt = `
            Generate 10 multiple-choice quiz questions about ${topic}. 
            Format the response in valid JSON as follows:
            [
              {
                "question": "Question text?",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "answer": "Correct answer"
              }
            ]
            Only return JSON, nothing else.
          `;
  
          const response = await this.openai.chat.completions.create({
              model: 'gpt-4o-mini', // You can also use 'gpt-3.5-turbo'
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 600, // Increase to allow more tokens for 10 questions
          });
  
          if (
              !response ||
              !response.choices ||
              !response.choices.length ||
              !response.choices[0].message ||
              !response.choices[0].message.content
          ) {
              throw new Error('Invalid response from OpenAI.');
          }
  
          let quizJson = response.choices[0].message.content.trim();
  
          // Remove ```json or ``` if present
          quizJson = quizJson.replace(/```json|```/g, '').trim();
  
          return JSON.parse(quizJson);
      } catch (error) {
          console.error('OpenAI API Error:', error.response?.data || error.message);
          throw new Error(error);
      }
  }
  
    
    
}
