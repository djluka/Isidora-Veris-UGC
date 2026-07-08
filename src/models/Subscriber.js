import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        service: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true, // createdAt / updatedAt (createdAt koristi mailer.js)
    }
);

// Jedan email može da se prijavi za više različitih usluga,
// ali ne dva puta za ISTU uslugu -> ovo generiše err.code 11000 na duplikat.
subscriberSchema.index({ email: 1, service: 1 }, { unique: true });

export const Subscriber = mongoose.model('Subscriber', subscriberSchema);