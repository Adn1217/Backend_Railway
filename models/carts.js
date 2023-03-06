import mongoose from 'mongoose';

const cartsCollection = 'carts';
const productsSchema = new mongoose.Schema({
  title: String,
  code: String,
  description: String,
  price: Number,
  stock: Number,
  thumbnail: String
});
const cartsSchema = new mongoose.Schema({
        usuario: String,
        productos: [productsSchema],
      });

export const cartsModel = mongoose.model(cartsCollection, cartsSchema);