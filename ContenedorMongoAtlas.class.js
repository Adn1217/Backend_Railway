import { ObjectId } from "mongodb";
import {productsModel} from './models/products.js';
import {msgsModel} from './models/messages.js';
import {cartsModel} from './models/carts.js';
import { productsCollection, messagesCollection, cartsCollection } from "./server.js";

export default class ContenedorMongoAtlas {
  constructor(collection) {
    this.collection = collection;
  }

  async save(elemento) {
    try {
      let newElement;
      if (this.collection === productsCollection){
        newElement = new productsModel(elemento);
      }else if (this.collection === messagesCollection){
        newElement = new msgsModel(elemento);
      }else if (this.collection === cartsCollection){
        newElement = new cartsModel(elemento);
      }else{
        newElement = new cartsModel(elemento);
      }
      let data = await newElement.save();
      console.log('GuardadoMongo: ', data);
      return data;
    } catch (error) {
      console.log("Se ha presentado error ", error);
    }
    //  finally {
    //   mongoose.disconnect();
    // }
  }

  async getById(Id) {
    try {
      let element;
      if (this.collection === productsCollection){
        element = await productsModel.find({_id: ObjectId(Id)});
      }else{
        element = await cartsModel.find({_id: ObjectId(Id)});
      }
      console.log(element);
      if (element[0]?._id) {
        // console.log("El elemento  es: ", element);
        return element[0];
      } else {
        return null;
      }
    } catch (error) {
      console.log("Se ha presentado error ", error);
    }
  }

  async getAll() {
    try {
      let data;
      if (this.collection === productsCollection){
        data = await productsModel.find();
      }else if (this.collection === messagesCollection){
        data = await msgsModel.find();
      }else{
        data = await cartsModel.find();
      }
      return data;
    } catch (error) {
      console.log("Se ha presentado error ", error);
    } 
    // finally {
    //   mongoose.disconnect();
    // }
  }

  async deleteById(Id) {
    let element; 
    try {
      if (this.collection === productsCollection){
        element = await productsModel.deleteOne({_id: ObjectId(Id)});
      }else{
        element = await cartsModel.deleteOne({_id: ObjectId(Id)});
      }
      console.log(element);
      if (element[0]?.acknowledged) {
        console.log(`\nSe elimina el elemento con _id=${Id} (deleteById(${Id})): \n`, element);
        // console.log("Quedan los productos: ", data);
      } else {
        console.log("No se ha podido eliminar el elemento ", Id);
      }
      return element;
    } catch (error) {
      console.log("Se ha presentado error ", error);
    }
  }
  
  async updateById(elemento, id) {
    try {
      let element;
      if (this.collection === productsCollection){
        element = await productsModel.findByIdAndUpdate(ObjectId(id), elemento );
      }else{
        element = await cartsModel.findByIdAndUpdate(ObjectId(id), elemento );
      }
      return element;
    } catch (error) {
      console.log("Se ha presentado error ", error);
    }
    //  finally {
    //   mongoose.disconnect();
    // }
  }
  
  async deleteProductInCartById(Id_prod, Id_cart = undefined) {
    try {
      let id_prod = Id_prod;
      let id_cart = Id_cart;
      let cart = await cartsModel.find({_id: ObjectId(id_cart)});
      cart = cart[0];
      console.log('Carrito encontrado: ',  cart);
      if(cart?._id === undefined) {
          console.log("No existe el carrito con id: ", id_cart);
          return false;
      }else{
        let cartProd = await cartsModel.find({'productos._id': ObjectId(id_prod)})
        console.log('Producto encontrado :',cartProd);
        if (cartProd && cartProd.length === 1){
          cartProd = cartProd[0];
          let index  = cartProd.productos.findIndex( (prod) => prod._id === ObjectId(id_prod));
          let deletedProd = cartProd.productos.splice(index,1)
          await cartProd.save();
          console.log(`Se elimina el producto con id = ${id_prod} del carrito con id = ${id_cart}`);
          return deletedProd;
        }else{
          console.log(`No existe el producto con id= ${id_prod} en el carrito con id=${id_cart}`);
          return undefined;
        }
      }
    } catch (error) {
      console.log("Se ha presentado error ", error);
    }
  }
  
}