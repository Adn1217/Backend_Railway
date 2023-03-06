import mongoose from 'mongoose';

const usersCollection = 'users';
const usersSchema = new mongoose.Schema({
        username: String,
        password: String
});

export const usersModel = mongoose.model(usersCollection, usersSchema);