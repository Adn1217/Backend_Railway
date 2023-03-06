import ContenedorArchivo from '../ContenedorArchivo.class.js';
import ContenedorMongoAtlas from '../ContenedorMongoAtlas.class.js';
import ContenedorFirebase from '../ContenedorFirebase.class.js';
import * as msgController from './messagesController.js';
import { faker } from '@faker-js/faker';
import { productsCollection } from '../server.js'
import logger from '../logger.js';

function createRandomProducts(n){
    const randomProducts = [];
    for(let i=0; i<n; i++){
        const randomProduct = {};
        randomProduct.title = faker.commerce.product();
        randomProduct.id = i+1;
        randomProduct.code = `Prd0${Math.round(Math.random()*100)}`;
        // randomProduct.price = (Math.random()*5000).toFixed(2);
        randomProduct.price = faker.commerce.price(100, 5000, 2);
        randomProduct.stock = Math.round((Math.random()*100));
        randomProduct.description = faker.commerce.productDescription();
        randomProduct.thumbnail = faker.image.imageUrl(720, 720, randomProduct.title);
        randomProducts.push(randomProduct);
    }
    return randomProducts;
}

export async function getProducts() {
    const productos = new ContenedorArchivo('./productos.json');
    const allProducts = await productos.getAll();
    const productosMongoAtlas = new ContenedorMongoAtlas(productsCollection);
    const allProductsMongoAtlas = await productosMongoAtlas.getAll();
    const productosFirebase = new ContenedorFirebase(productsCollection);
    const allProductsFirebase = await productosFirebase.getAll();
    return allProductsFirebase
} 

export function getRandomProducts(n) {
    const allProductsRandom = createRandomProducts(n);
    // console.log(allProductsRandom);
    logger.debug(`${JSON.stringify(allProductsRandom)}`);
    return allProductsRandom
} 

async function saveProduct(prod) {
    const productosMongoAtlas = new ContenedorMongoAtlas(productsCollection);
    const newProductIdMongoAtlas = await productosMongoAtlas.save(prod);
    const productosFirebase = new ContenedorFirebase(productsCollection);
    const newProductIdFirebase = await productosFirebase.save(prod);
    const productos = new ContenedorArchivo('./productos.json');
    const newProductId = await productos.save(prod);
    return newProductIdFirebase
} 

async function saveAllProducts(prods) {
    const productos = new ContenedorArchivo('./productos.json');
    const saved = await productos.saveAll(prods);
    return saved 
}

async function saveProductByIdFile(res, updatedProd, id){
    id = parseInt(id);
    const productos = new ContenedorArchivo('./productos.json');
    const allProducts = await productos.getAll();
    let actualizadoArchivo = {actualizadoArchivo: updatedProd};
    let productById = allProducts.find((product) => product.id === id) 
    if (!productById){
        actualizadoArchivo = {error: "Producto no encontrado"};
        // res.send({error: "Producto no encontrado"});
    }else{
        let newAllProducts = allProducts.map((prod) => {
            if(prod.id === id){
                prod = updatedProd;
                prod.id = id;
                // console.log(prod);
            }
            return prod;
        })
        // console.log('La nueva lista es: ', newAllProducts);
        logger.debug(`La nueva lista es: ${JSON.stringify(newAllProducts)}`);
        const allSaved = await saveAllProducts(newAllProducts);
        if (allSaved === 'ok'){
            // res.send({actualizado: updatedProd})
        }else{
            actualizadoArchivo = {error: allSaved};
            // res.send({error: allSaved})
        }
    }
    // console.log("Actualizado en Archivo: ", actualizadoArchivo)
    if('error' in actualizadoArchivo){
        logger.error(`${JSON.stringify(actualizadoArchivo)}`);
    }else{
        logger.debug(`Actualizado en Archivo: ${JSON.stringify(actualizadoArchivo)}`);
    }
}

export async function getProductById(id) {
    const productos = new ContenedorArchivo('./productos.json');
    const product = await productos.getById(id);
    const productosMongoAtlas = new ContenedorMongoAtlas(productsCollection);
    const productMongoAtlas = await productosMongoAtlas.getById(id);
    const productosFirebase = new ContenedorFirebase(productsCollection);
    const productFirebase = await productosFirebase.getById(id);
    return productFirebase
}

async function deleteProductById(id) {
    const productosFirebase = new ContenedorFirebase(productsCollection);
    const productFirebase = await productosFirebase.deleteById(id);
    // const productosMongoAtlas = new ContenedorMongoAtlas(productsCollection);
    // const productMongoAtlas = await productosMongoAtlas.deleteById(id);
    const productos = new ContenedorArchivo('./productos.json');
    const product = await productos.deleteById(id);
    return productFirebase
}

export async function showProducts(req, res) {
    const allProducts = await getProducts(); 
    const allMessages = await msgController.getMessages();
    // console.log('Los productos son: \n', allProducts);
    // res.send({products: allProducts})
    const user = req.user.username;
    res.render('pages/index', {user: user, products: allProducts, msgs: allMessages});
}

export async function showProductsRandom(res) {
    const allProducts = await getProductsRandom(); 
    const allMessages = await msgController.getMessages();
    // console.log('Los productos son: \n', allProducts);
    // res.send({products: allProducts})
    const user = req.session.user;
    res.render('pages/index', {user: user, products: allProducts, msgs: allMessages});
}

export async function doSaveProduct(product, res) {
    if (Object.keys(product).length === 0){
        logger.error('Producto no recibido');
        res.send({Error: "Producto no recibido"})
    }else{
        // console.log('ProductoFront', product);
        const newProd = await saveProduct(product); 
        res.send({Guardado: newProd})
    }
}

export async function showProductById(res, id) {
    let productById = await getProductById(id);
    if (!productById){
        logger.error(`Producto ${id} no encontrado`);
        res.send({error:"Producto no encontrado"});
    }else{
        res.send({producto: productById});
        // console.log(productById);
        logger.debug(`productById: ${JSON.stringify(productById)}`);
    }
}

export async function updateProductById(res, updatedProd, id) {

    const productosFirebase = new ContenedorFirebase(productsCollection);
    const productFirebase = await productosFirebase.updateById(updatedProd,id);
    if (productFirebase){
        // console.log("Se ha actualizado el producto: \n", productFirebase);
        logger.info(`Se ha actualizado el producto: ${productFirebase}`);
        res.send({actualizadoFirebase: productFirebase})
    }else{
        // console.log("Producto no actualizado");
        logger.warn('Producto no actualizado');
        logger.error(`Producto ${id} no encontrado`);
        res.send({error: "Producto no encontrado"});
    }

    const productosMongoAtlas = new ContenedorMongoAtlas(productsCollection);
    const productMongoAtlas = await productosMongoAtlas.updateById(updatedProd,id);
    if (productMongoAtlas){
        // console.log("Se ha actualizado en Mongo el producto: \n", productMongoAtlas);
        logger.info(`Se ha actualizado en Mongo el producto: ${JSON.stringify(productMongoAtlas)}`);
        // res.send({actualizadoMongo: productMongoAtlas})
    }else{
        // console.log("Producto no actualizado en Mongo");
        logger.warn("Producto no actualizado en Mongo");
        // res.send({error: "Producto no encontrado"})
    }
    await saveProductByIdFile(res, updatedProd, id);
}

export async function doDeleteProductById(res, id) {
    let deletedProduct = await deleteProductById(id);
    if (!deletedProduct){
        deletedProduct = {
            error: "Producto no encontrado"
        }
        logger.error(`Producto ${id} no encontrado.`)
        res.send(deletedProduct)
    }else{
        res.send({eliminado: deletedProduct})
    }
    return deletedProduct;
}