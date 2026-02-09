import {
    Schema,
    Prop,
    SchemaFactory,
} from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
    export class User extends Document {
        @Prop({ required: true, unique: true })
        email: string;
        @Prop({ required: true })
        password: string;
        @Prop({ required: true })
        phone: string;
        @Prop({ required: true })
        fullname: string;
    }
    
export const UserSchema = SchemaFactory.createForClass(User);