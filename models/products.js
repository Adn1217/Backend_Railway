import mongoose from 'mongoose';

const productsCollection = 'products';
const productsSchema = new mongoose.Schema({
        title: String,
        code: String,
        description: String,
        price: Number,
        stock: Number,
        thumbnail: String
      });

export const productsModel = mongoose.model(productsCollection, productsSchema);