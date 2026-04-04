import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class HeroContent {
  @Prop({ default: 'Learn from the Best' })
  title: string;

  @Prop({ default: 'Join 100,000+ students and professionals worldwide.' })
  subtitle: string;

  @Prop({ default: '/hero.jpg' })
  imageUrl: string;

  @Prop({ default: 'Get Started' })
  ctaText: string;

  @Prop({ default: '/registration' })
  ctaLink: string;
}

@Schema({ _id: false })
class StatItem {
  @Prop()
  label: string;

  @Prop()
  value: string;

  @Prop()
  icon: string; // Lucide icon name
}

@Schema({ _id: false })
class FeatureItem {
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop()
  icon: string; // Lucide icon name
}

@Schema({ _id: false })
class TestimonialItem {
  @Prop()
  name: string;

  @Prop()
  role: string;

  @Prop()
  feedback: string;

  @Prop()
  avatar: string;
}

@Schema({ _id: false })
class PartnerItem {
  @Prop()
  name: string;

  @Prop()
  logoUrl: string;
}

@Schema({ versionKey: false, timestamps: true })
export class LandingPage extends Document {
  @Prop({ default: 'landing-page', unique: true })
  slug: string;

  @Prop({ type: HeroContent, default: () => ({}) })
  hero: HeroContent;

  @Prop({ type: [StatItem], default: [] })
  stats: StatItem[];

  @Prop({ type: [FeatureItem], default: [] })
  features: FeatureItem[];

  @Prop({ type: [TestimonialItem], default: [] })
  testimonials: TestimonialItem[];

  @Prop({ type: [PartnerItem], default: [] })
  partners: PartnerItem[];
}

export const LandingPageSchema = SchemaFactory.createForClass(LandingPage);
