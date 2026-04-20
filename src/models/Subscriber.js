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

// Unique index na kombinaciji email + service
// Znači isti email može da se prijavi za različite servise, ali ne dva puta za isti
subscriberSchema.index({ email: 1, service: 1 }, { unique: true });

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);