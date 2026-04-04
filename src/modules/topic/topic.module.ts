import { Module } from '@nestjs/common';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Topic, TopicSchema } from 'src/schema/topic.schema';
import { SubCategory, SubCategorySchema } from 'src/schema/sub-category.schema';

@Module({
  imports:[MongooseModule.forFeature([{name: Topic.name, schema: TopicSchema},
    {name: SubCategory.name, schema: SubCategorySchema}
  ])],
  controllers: [TopicController],
  providers: [TopicService],
  exports:[TopicService]
})
export class TopicModule {}
