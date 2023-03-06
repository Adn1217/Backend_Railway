import mongoose from 'mongoose';

const sessionsCollection = 'sessions';
const sessionsSchema = new mongoose.Schema({
        user: String,
});

export const cartsModel = mongoose.model(cartsCollection, cartsSchema);