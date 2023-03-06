import ContenedorArchivo from '../ContenedorArchivo.class.js';
import ContenedorMongoAtlas from '../ContenedorMongoAtlas.class.js';
import ContenedorFirebase from '../ContenedorFirebase.class.js';
import { calculateId } from '../functions.js';
import { cartsCollection } from '../server.js';
import logger from '../logger.js';

async function saveCart(cart) {
    const carritoFirebase = new ContenedorFirebase(cartsCollection);
    const savedFirebase = await carritoFirebase.save(cart);
    const carritoMongoAtlas = new ContenedorMongoAtlas(cartsCollection);
    const savedMongoAtlas = await carritoMongoAtlas.save(cart);
    const carrito = new ContenedorArchivo('./cart.json');
    const saved = await carrito.save(cart);
    return savedFirebase
} 

async function saveAllCarts(carts) {
    const allCarts = new ContenedorArchivo('./cart.json');
    const saved = await allCarts.saveAll(carts);
    return saved 
}

async function saveProductInCartByIdFile(res, newProd, id_cart){
    const carrito = new ContenedorArchivo('./cart.json');
    const allCarts = await carrito.getAll();
    const cart = allCarts.find( (cart) => cart.id === id_cart);
    let actualizadoArchivo = {actualizadoArchivo: cart};
    if(!cart){
        // res.send({Error: `No se encuentra el carrito ${id_cart}`})
        actualizadoArchivo = {Error: `No se encuentra el carrito ${id_cart}`}
    }else{
        let newProdWithId = calculateId(newProd, cart.productos)
        newProdWithId.timestamp = new Date().toLocaleString("en-GB");
        cart.productos.push(newProd);
        const allSaved = await saveAllCarts(allCarts);
        if (allSaved === 'ok'){
            // res.send({actualizado: cart})
        }else{
            actualizadoArchivo = {error: allSaved};
            // res.send({error: allSaved})
        }
    }
    // console.log("Actualizado en Archivo: ", actualizadoArchivo)
    logger.debug(`Actualizado en Archivo: ${JSON.stringify(actualizadoArchivo)}`)
}

async function getCarts() {
    const carrito = new ContenedorArchivo('./cart.json');
    const cart = await carrito.getAll();
    const carritoMongoAtlas = new ContenedorMongoAtlas(cartsCollection);
    const cartMongoAtlas = await carritoMongoAtlas.getAll();
    const carritoFirebase = new ContenedorFirebase(cartsCollection);
    const cartFirebase = await carritoFirebase.getAll();
    return cartFirebase
} 

async function getCartById(id) {
    const carritosFirebase = new ContenedorFirebase(cartsCollection);
    const cartFirebase = await carritosFirebase.getById(id);
    const carritos = new ContenedorArchivo('./cart.json');
    const cart = await carritos.getById(id);
    const carritoMongoAtlas = new ContenedorMongoAtlas(cartsCollection);
    const cartMongoAtlas = await carritoMongoAtlas.getById(id);
    return cartFirebase
}

async function deleteCartById(id_cart) {
    const cartsFirebase = new ContenedorFirebase(cartsCollection);
    const cartFirebase = await cartsFirebase.deleteById(id_cart);
    const carts = new ContenedorArchivo('./cart.json');
    const cart = await carts.deleteById(id_cart);
    const carritoMongoAtlas = new ContenedorMongoAtlas(cartsCollection);
    const cartMongoAtlas = await carritoMongoAtlas.deleteById(id_cart);
    return cartFirebase
}

async function deleteProductInCartById(id_prod, id_cart) {
    const cartsFirebase = new ContenedorFirebase(cartsCollection);
    const cartFirebase = await cartsFirebase.deleteProductInCartById(id_prod, id_cart);
    const carts = new ContenedorArchivo('./cart.json');
    const cart = await carts.deleteProductInCartById(id_prod, id_cart);
    const cartsMongoAtlas = new ContenedorMongoAtlas(cartsCollection);
    const cartMongoAtlas = await cartsMongoAtlas.deleteProductInCartById(id_prod, id_cart);
    return cartFirebase
}

export async function showCart(res) {
    const cart = await getCarts(); 
    // console.log('El carrito es: \n', cart);
    logger.debug(`El carrito es: ${cart}`)
    res.send({carrito: cart})
    // res.render('pages/index', {products: allProducts, msgs: allMessages})
}

export async function showCartById(res, id) {
    let cartById = await getCartById(id);
    // console.log(cartById);
    // logger.debug(`El carrito es: ${JSON.stringify(cartById)}`)
    if (!cartById){
        res.send({error:"Carrito no encontrado"});
    }else{
        res.send({productoCarrito: cartById.productos});
        // console.log(cartById.productos);
        logger.debug(`Los productos del carrito son: ${JSON.stringify(cartById.productos)}`)
    }
}

export async function doDeleteCartById(res, id) {
    let deletedCart = await deleteCartById(id);
    if (!deletedCart || deletedCart?.deletedCount == 0){
        deletedCart = {
            error: "Carrito no encontrado"
        }
        res.send(deletedCart)
    }else{
        res.send({eliminado: deletedCart})
    }
    // return deletedCart;
}

export async function doDeleteProductInCartById(res, id_prod, id_cart) {
    let deletedProduct = await deleteProductInCartById(id_prod, id_cart);
    // console.log("Producto eliminado: ", deletedProduct);
    logger.info(`Producto eliminado: ${deletedProduct}`);
    if (!deletedProduct && deletedProduct !== undefined){
        deletedProduct = {
            error: `Carrito ${id_cart} no encontrado`
        }
        res.send(deletedProduct)
    }else{
        if (deletedProduct === undefined){
            deletedProduct = {
                error: `Producto ${id_prod} no encontrado en el carrito ${id_cart}`
            }
            res.send(deletedProduct)
        }else{
            res.send({eliminado: deletedProduct})
        }
    }
    return deletedProduct;
}

export async function doSaveCart(res, cart) {
    const newCart = await saveCart(cart);
    res.send({Guardado: newCart})
}


export async function doSaveProductInCart(res, newProd, id_cart) {

    const cartsFirebase = new ContenedorFirebase(cartsCollection);
    const cartFirebase = await cartsFirebase.getById(id_cart);
    // console.log('Carrito en Firebase', cartFirebase);
    logger.debug(`Carrito en Firebase ${cartFirebase}`);
    if (cartFirebase){
        let newProdWithId = calculateId(newProd, cartFirebase.productos)
        newProdWithId.timestamp = new Date().toLocaleString("en-GB");
        cartFirebase.productos.push(newProdWithId);
        cartsFirebase.updateById(cartFirebase, id_cart);
        // console.log("Se ha agregado en Firebase el producto: \n", newProdWithId);
        logger.debug(`Se ha agregado en Firebase el producto: ${newProdWithId}`);
        res.send({actualizadoFirebase: cartFirebase})
    }else{
        // console.log("Carrito no encontrado en Firebase.");
        logger.error(`Carrito ${id_cart} no encontrado en Firebase.`);
        res.send({error: "Carrito no encontrado"})
    }

    const cartsMongoAtlas = new ContenedorMongoAtlas(cartsCollection);
    const cartMongoAtlas = await cartsMongoAtlas.getById(id_cart);
    let actualizadoMongo = {actualizadoMongo: cartMongoAtlas};
    if (cartMongoAtlas){
        cartMongoAtlas.productos.push(newProd);
        let cart = await cartsMongoAtlas.updateById(cartMongoAtlas, id_cart);
        // console.log("Se ha agregado en Mongo el producto al carrito: \n", cart);
        logger.debug(`Se ha agregado en Mongo el producto al carrito: ${cart}`, cart);
        // res.send({actualizadoMongo: cartMongoAtlas})
    }else{
        // console.log("Carrito no encontrado en Mongo.");
        logger.error(`Carrito ${id_cart} no encontrado en Mongo.`);
        actualizadoMongo = {error: "Carrito no encontrado en Mongo."}
        // res.send({error: "Carrito no encontrado"})
    }
    // console.log(actualizadoMongo);
    logger.info(`${JSON.stringify(actualizadoMongo)}`);
    await saveProductInCartByIdFile(res, newProd, parseInt(id_cart));
}
 // Sin FRONT.
export async function updateCartById(res, updatedCart, id) {
    let cartById = await getCartById(id);
    if (!cartById){
        logger.error(`Carrito ${id} no encontrado`);
        res.send({error: "Carrito no encontrado"});
    }else{
        const allCarts = await getCarts();
        const newCarts = allCarts.map((cart) => {
            if(cart.id === id){
                cart = updatedCart;
                cart.id = id;
                console.log(cart);
            }
            return cart;
        })
        // console.log('La nueva lista de carritos es: ', newCarts);
        logger.debug(`La nueva lista de carritos es: ${JSON.stringify(newCarts)}`);
        const allSaved = await saveAllCarts(newCarts);
        if (allSaved === 'ok'){
            res.send({actualizado: updatedCart})
        }else{
            logger.error(`Se ha presentado error al guardar de forma local: ${allSaved}`)
            res.send({error: allSaved})
        }
    }
}