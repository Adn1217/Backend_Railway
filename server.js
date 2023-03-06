
import cluster from 'cluster';
import os from 'os';
// import {spawn} from 'child_process';
import express from 'express';
import mongoose from 'mongoose';
import {Server as HttpServer} from 'http';
import {Server as IOServer} from 'socket.io';
import path from 'path';
import {fileURLToPath} from 'url';
// import {getURL, serviceAccount} from './config.js';
import {getURL, loadMocktoFireBase, logRequest} from './functions.js';

// import dotenv from 'dotenv';
import parseArgs from 'minimist';

import * as prdController from './controller/productsController.js';
import * as msgController from './controller/messagesController.js';
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"
import admin from 'firebase-admin';
// import { doc, getDoc } from "firebase/firestore"

import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import {usersModel} from './models/users.js';

import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import bcrypt from 'bcrypt'; 

import {login, register, logout} from './routes/login.js';
import {mensajes} from './routes/messages.js';
import {productos, productosTest} from './routes/products.js';
import {carrito} from './routes/carts.js';
import {random} from './routes/random.js';

import compression from 'compression';
import logger from './logger.js';

const numCPUs = os.cpus().length;

// dotenv.config({
//     path: './.env'
// })
const userName = process.env.DB_MONGO_USER;
const pwd = process.env.DB_MONGO_PWD;
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);
const mongoAtlasDb = process.env.DB_MONGOATLAS;
const usersCollection = process.env.DB_USERS_COLLECTION;
const sessionsCollection = process.env.DB_SESSIONS_COLLECTION;
export const productsCollection = process.env.DB_PRODUCTS_COLLECTION;
export const cartsCollection = process.env.DB_CARTS_COLLECTION;
export const messagesCollection = process.env.DB_MESSAGES_COLLECTION;
const sessionSecret = process.env.SESSION_SECRET;
const options = {
    alias: {
        p: 'port',
        m: 'mode'
    }, 
    default: {
        port: parseInt(process.env.PORT, 10) || 8080,
        mode: 'fork'
    }
};
const args = parseArgs(process.argv.slice(2), options);
mongoose.set('strictQuery', false);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// const port = parseInt(process.env.PORT, 10) || 8080;
if(isNaN(args['port']) || (typeof(args['port']) !== 'number')){
    args['port'] = parseInt(process.env.PORT, 10) || 8080;
    // console.warn(`Se ingresa puerto inválido. Se toma puerto ${args['port']} por defecto.`);
    logger.warn(`Se ingresa puerto inválido. Se toma puerto ${args['port']} por defecto.`);
}
const port = args['port'];
// spawn('export', [`PORT=${port}`]);
process.env['PORT'] = port;

const mode = args['mode'];

if(mode !== 'cluster' && mode !=='fork'){
    // console.warn('Modo inválido, se ejecutará en el modo fork por defecto.');
    logger.warn('Modo inválido, se ejecutará en el modo fork por defecto.');
}

const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);

const advancedOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

export let dbFS;

app.use(express.urlencoded({extended: true}))
app.use(express.json());

// const usuarios = []; // Persistencia local.

function encrypt(pwd){
    let encrypted = bcrypt.hashSync(pwd, bcrypt.genSaltSync(10), null)
    return encrypted
}

async function mongoAtlasConnect(db, userName, pwd){
    try{
        const URL = getURL(db, userName, pwd);
        await mongoose.connect(URL, advancedOptions)
        // console.log(`Servidor ${process.pid} se ha conectado exitosamente a MongoAtlas`);
        logger.info(`Servidor ${process.pid} se ha conectado exitosamente a MongoAtlas`);
    }catch(error){
        // console.error(`se ha presentado el siguiente error al intentar conectar el servidor ${process.pid} a mongoatlas: ${error}`);
        logger.error(`se ha presentado el siguiente error al intentar conectar el servidor ${process.pid} a mongoatlas: ${error}`);
    }
}

function firebaseConnect(){
    try{
        admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
        });
        // console.log(`Servidor ${process.pid} se ha conectado exitosamente a FireBase`)
        logger.info(`Servidor ${process.pid} se ha conectado exitosamente a FireBase`)
    }catch(error){
        // console.error(`Se ha presentado error al intentar conectar el servidor ${process.pid} con Firebase: ${error}`)
        logger.error(`Se ha presentado error al intentar conectar el servidor ${process.pid} con Firebase: ${error}`)
    }
}

async function saveUserFirebase(newUser){
    let query = dbFS.collection(usersCollection);
    let data = await query.add(newUser);
    return data.id
}

async function saveUserMongoAtlas(newUser){
    let newElement = new usersModel(newUser);
    let data = await newElement.save();
    return data
}

async function searchUserFirebase(username){
    let query = dbFS.collection(usersCollection);
    let data = await query.where('username','==', username).get();
    // console.log('Empty: ',data.empty);
    if (data.empty){
        return null ;
    }else{
        let usuario = null;
        data.forEach((doc) => {
            usuario = doc.data();
            // console.log(doc.id + ' => ' + JSON.stringify(doc.data()));
        })
        // console.log('Usuario :', usuario);
        return usuario;
    }
}

async function searchUserMongoAtlas(username){
    let user = usersModel.findOne({username: username});
    if(!user){
        return null
    }else{
        return user
    }
}

passport.use('register', new LocalStrategy({
    passReqToCallback: true
}, async function(req, username, password, done){
    try{

        // const usuario = usuarios.find(usuario => usuario.username === username);
        const usuario = await searchUserFirebase(username);
        const usuarioMongoAtlas = await searchUserMongoAtlas(username);

        if(usuario){
            // console.log('Usuario encontrado FB: ', usuario)
            logger.info(`Usuario encontrado FB: ${usuario.username}`);
            // console.log('Usuario encontrado Mongo Atlas: ', usuarioMongoAtlas)
            logger.info(`Usuario encontrado Mongo Atlas: ${usuarioMongoAtlas._id}}`);
            return done(null, false, {message: 'El usuario ya está registrado'})
        }

        const newUser = {
            username: username,
            password: encrypt(password)
        }

        // usuarios.push(newUser); // Persistencia local.

        let newUserId = await saveUserFirebase(newUser);
        // console.log('Nuevo Usuario FB Id: ', newUserId);
        logger.info(`Nuevo Usuario FB Id:  ${newUserId}`);
        let newUserSaved = await saveUserMongoAtlas(newUser);
        // console.log('Nuevo Usuario Mongo Atlas: ', newUserSaved);
        logger.info(`Nuevo Usuario Mongo Atlas:  ${newUserSaved._id}`);
        done(null, newUser);
    }catch(err){
        done(err);
    }

}));

passport.use('login', new LocalStrategy( 
    async function(username, password, done){
        try{
            // const usuario = usuarios.find( usuario => usuario.username === username);
            const usuario = await searchUserFirebase(username);
            // console.log('usuario FB: ', usuario)
            logger.info(`usuario FB autenticado: ${JSON.stringify(usuario.username)}`);
            if(!usuario){
                return done(null, false, {message: 'El usuario no existe'});
            }
            
            if(!bcrypt.compareSync(password, usuario.password)){
                // console.log('Contraseña incorrecta');
                logger.warn(`Contraseña incorrecta para el usuario FB: ${JSON.stringify(usuario.username)}`);
                return done(null, false, {message: 'Contraseña incorrecta'});
            }

            return done(null, usuario);

        }catch(err){

            return done(err);
        }
    }
))

passport.serializeUser((user, done) => {
    done(null, user.username);
})

passport.deserializeUser(async (username, done) => {
    // console.log('Usuarios: '+ JSON.stringify(usuarios) + ' Usuario autenticado: '+ username);
    // const usuario = usuarios.find(usuario => usuario.username === username); //Persistencia local
    const usuario = await searchUserFirebase(username);
    done(null, usuario);
})


app.use(cookieParser());
app.use(session({
    name: 'loggedUser',
    store: MongoStore.create({
        mongoUrl: getURL(mongoAtlasDb, userName, pwd),
        mongoOptions: advancedOptions,
        collectionName: sessionsCollection,
        ttl: 60,
    }),
    secret: sessionSecret,
    resave: false,
    rolling: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 60000,
        // httpOnly: false
    }
}))

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
// app.set('views', "./views"); //Por defecto.
app.use('/static', express.static(path.join(__dirname, 'public')))
// app.use(express.static(__dirname + '/public'));
// console.log(__dirname + '/public');

app.use('/', logRequest);
app.post('/login',
    passport.authenticate('login', {
    failureRedirect: '/faillogin', 
    successRedirect: '/successlogin'
    })
)
app.use('/login', login, (req, res) =>{
    logger.warn(`Petición ${req.method} a ruta inexistente ${req.originalUrl}`)
    res.sendStatus(400);
});
app.post('/register',
    passport.authenticate('register', {
    failureRedirect: '/failregister', 
    successRedirect: '/successregister'
    })
)
app.use('/register', register, (req, res) =>{
    logger.warn(`Petición ${req.method} a ruta inexistente ${req.originalUrl}`)
    res.sendStatus(400);
});
app.use('/logout', logout, (req, res) =>{
    logger.warn(`Petición ${req.method} a ruta inexistente ${req.originalUrl}`)
    res.sendStatus(400);
});
app.use('/productos', productos, (req, res) =>{
    logger.warn(`Petición ${req.method} a ruta inexistente ${req.originalUrl}`)
    res.sendStatus(400);
});
app.use('/productos-test', productosTest, (req, res) =>{
    logger.warn(`Petición ${req.method} a ruta inexistente ${req.originalUrl}`)
    res.sendStatus(400);
});
app.use('/carrito', carrito,(req, res) =>{
    logger.warn(`Petición ${req.method} a ruta inexistente ${req.originalUrl}`)
    res.sendStatus(400);
});
app.use('/mensajes', mensajes, (req, res) =>{
    logger.warn(`Petición ${req.method} a ruta inexistente ${req.originalUrl}`)
    res.sendStatus(400); //Bad Request
});
app.use('/randoms', compression(), random, (req, res) =>{
    logger.warn(`Petición ${req.method} a ruta inexistente ${req.originalUrl}`)
    res.sendStatus(400); //Bad Request
});

// loadMocktoFireBase(['products']); // Habilitar solo al requerirse recargar mocks originales.

io.on('connection', (socket) => {
    // console.log('Usuario Conectado');
    logger.info('Usuario conectado');
    socket.emit('welcome', 'Usuario conectado');
    // mongoAtlasConnect('ecommerce');

    socket.on('productRequest', async () => {
        const allProducts = await prdController.getProducts();
        io.sockets.emit('productos', {productos: allProducts});
    })
    
    socket.on('messageRequest', async () => {
        let allMsgs = await msgController.getMessages();
        io.sockets.emit('mensajes', {msgs: allMsgs});
    })

    socket.on('normMessageRequest', async () => {
        let allMsgs = await msgController.getNormMessages();
        // console.log('Mensajes Normalizados: ', JSON.stringify(allMsgs));
        io.sockets.emit('mensajes', {msgs: allMsgs});
    })
})

app.get('/', (req, res) => {
    res.redirect('/login');
})

app.get('/home', compression(), (req, res) => {
    if(req.isAuthenticated()){
        // console.log('SesiónIniciada: ', req.session);
        logger.info(`SesiónIniciada: ${JSON.stringify(req.session)}`);
        prdController.showProducts(req, res);
    }else{
        // res.sendStatus(401); //Unauthorized
        res.status(401).send({Error: 'Usuario no autenticado'})
        // res.send({Error: 'Usuario no autenticado'})
    }
})

app.get('/info', compression(), (req, res) =>{
    const usedArgs = {
        inputArgs : args,
        OS: process.env.OS,
        numCPUs: numCPUs,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage().rss,
        execPath: process.execPath,
        processID: process.pid,
        filePath: process.env.PWD
    }
    // console.log("ProcessInfo: ",usedArgs);
    logger.info(`ProcessInfo: ${JSON.stringify(usedArgs)}`);
    res.render('pages/info.ejs', {Args: usedArgs});
    // res.send(usedArgs);
})

app.get('/faillogin', (req, res) =>{
    res.status(401).send({status: 'Autenticación incorrecta'});
})

app.get('/faillog', (req, res) =>{
    res.render('pages/login', {error: 'Autenticación incorrecta'});
})

app.get('/successlogin', (req, res) =>{
    res.status(200).send({status: 'Ok'});
})

app.get('/failregister', (req, res) => {
    res.status(400).send({status:'El usuario ya existe'});
})

app.get('/failreg', (req, res) => {
    res.render('pages/register', {error: 'El usuario ya existe'});
})

app.get('/successregister', (req, res) => {
    res.status(200).send({status: 'Ok'});
})

app.use('*', (req, res) =>{
    logger.warn(`Petición ${req.method} a ruta inexistente ${req.originalUrl}`)
    res.sendStatus(404) //Not Found
});

if(cluster.isPrimary && mode === 'cluster'){
    // console.log('CPUs: ', numCPUs );
    logger.silly(`CPUs: ${numCPUs}`);
    // console.log(`Servidor maestro ${process.pid} escuchando en el puerto ${port}`)
    logger.debug(`Servidor maestro ${process.pid} escuchando en el puerto ${port}`)
    for(let i=0; i<numCPUs; i++){
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        // console.log(`Hijo ${worker.process.pid} finalizado.`)
        logger.debug(`Hijo ${worker.process.pid} finalizado.`)
    })

}else{
    let serverType='';
    mongoAtlasConnect(mongoAtlasDb, userName, pwd);
    firebaseConnect();
    dbFS = admin.firestore();
    const server = httpServer.listen(port, () => {
        if(mode === 'cluster'){
            serverType = ' hijo';
        }
        // console.log(`Servidor${serverType} ${process.pid} escuchando en el puerto ${port}`);
        logger.debug(`Servidor${serverType} ${process.pid} escuchando en el puerto ${port}`);
    })
    server.on('error', (error) => {
        // console.log('Se presentó error: ', error.message)
        logger.error(`Se presentó error: ${error.message}`)
    }) 
    // console.log('\n################INICIO DE SERVIDOR################\n')
    logger.silly('################INICIO DE SERVIDOR################')
}
