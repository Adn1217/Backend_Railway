import fs from 'fs'
import { dbFS } from './server.js';
import logger from './logger.js';

export function getURL(db, userName, pwd) {
    const URL = `mongodb+srv://${userName}:${pwd}@backendcluster.mlmtmq6.mongodb.net/${db}?retryWrites=true&w=majority`;
    return URL
}

export function calculateId(elemento, data){
    let id = 0;
    let idMax = id;
    data.forEach((elemento) => {
        elemento.id > idMax && (idMax = elemento.id);
    });
    id = idMax + 1;
    elemento.id = id;
    console.log('ElementoWithId', elemento)
    return elemento
}

export async function loadMocktoFireBase(colecciones){

    for (let i = 0; i < colecciones.length;i++){
        if (colecciones[i] === 'products'){
            const stockData = './mockProductos.json';
            const productsTestCollection = dbFS.collection(colecciones[i]);
            await loadMockData(stockData, productsTestCollection);
        }else if (colecciones[i] ==='carts'){
            const stockData = './mockCart.json';
            const cartsTestCollection = dbFS.collection(colecciones[i]);
            await loadMockData(stockData, cartsTestCollection);
        }
    }
}

async function loadMockData(stockData, coleccion){
    let data = JSON.parse(fs.readFileSync(stockData));
    let resp = [];
    let ids = [];
    let success = true;
    let msg = '';
    console.log(`Cargando datos de ${JSON.stringify(coleccion._queryOptions.collectionId)} a Firebase...`)

    await Promise.all(data.map(async (doc) =>{
        try {
            resp = await coleccion.add(doc);
            ids.push(resp.id)
        }catch(error){
            success = false;
            console.log("Se ha presentado el siguiente error durante el proceso de carga", error);
        }finally{
            msg ="La carga ha " + (success ? "sido exitosa" : "fallado");
            console.log(msg);
        }
    }));
    (success) && (console.log('Fueron cargados productos con los siguientes ids: '+ids.join(', ')));
}

export async function onlyAdmin(req, res, next, params) {
    const isAdmin = req.headers.auth; //Solo para poder probarlo desde el Front.
    // console.log(String(isAdmin).toLowerCase() == "true");
    if (String(isAdmin).toLowerCase() == "true") { 
        next(...params);
    } else { 
        res.status(401).json({error:-1,descripcion:`Ruta ${req.originalUrl} metodo ${req.method} no autorizado`});
    }
}

export function isLogged(req, res, next){
    if (req.isAuthenticated()){
        next()
    }else{
        res.send({error: 'Usuario no autenticado'});
    }
}

export function logRequest(req, res, next){
    logger.info(`Petición ${req.method} a ruta ${req.url}`)
    next()
}

export function randomCount(cant=0){
    let conteo = {};
    for (let i=0; i<cant; i++){
        // console.log(i);
        let randNumber = Math.floor(Math.random()*cant);
        if (Object.keys(conteo).includes(randNumber.toString())){
            conteo[randNumber] += 1;
        }else{
            conteo[randNumber] = 1;
        }
    }
    return conteo;
}