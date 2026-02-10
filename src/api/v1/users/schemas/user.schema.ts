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
        @Prop()
        teslaState?: string;

        @Prop()
        teslaAccessToken?: string;

        @Prop()
        teslaRefreshToken?: string;

        @Prop()
        teslaTokenExpiresAt?: Date;
    }
    
export const UserSchema = SchemaFactory.createForClass(User);