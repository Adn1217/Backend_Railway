import express from 'express';
import {onlyAdmin, isLogged} from '../functions.js';
import * as prdController from '../controller/productsController.js';
import logger from '../logger.js';

const { Router } = express;
export const productos = new Router();
export const productosTest = new Router();

productos.use('/', isLogged);
productosTest.use('/', isLogged);

productos.get('/:id?', async(req, res) => {
    if(Object.keys(req.query).length > 0 || req.params.id){
        const id = req.query.id || req.params.id
        prdController.showProductById(res, id);
    }else{
        let allProducts = await prdController.getProducts()
        res.send(allProducts);
    }
})

productosTest.get('/', async(req, res) => {
    let allRandomProducts = prdController.getRandomProducts(5);
    res.send(allRandomProducts);
})

productos.post('/', (req, res) => {
    onlyAdmin(req, res, prdController.doSaveProduct, [req.body, res]);
})


productos.put('/:id', (req, res) => { 
    const prod = req.body;
    const id = req.params.id;
    onlyAdmin(req, res, prdController.updateProductById, [res, prod, id]);
})

productos.delete('/:id', (req, res) => {
    const {id} = req.params;
    onlyAdmin(req, res, prdController.doDeleteProductById, [res, id]);
})