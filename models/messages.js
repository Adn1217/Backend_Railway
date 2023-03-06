import mongoose from 'mongoose';

const msgsCollection = 'messages';
const msgsSchema = new mongoose.Schema({
        usuario: String,
        mensaje: String,
      });

export const msgsModel = mongoose.model(msgsCollection, msgsSchema);