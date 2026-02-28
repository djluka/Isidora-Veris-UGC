import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    service: {
        type: String,
        required: true,
        enum: ['konsultacije', 'kontent-strategija', 'ugc'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);