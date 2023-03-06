import express from 'express';

const { Router } = express;
export const login = new Router();
export const register = new Router();
export const logout = new Router();

login.get('/', (req, res) => {
    res.render('pages/login', {error: null});
})

register.get('/', (req, res) => {
    res.render('pages/register', {error: null});
})

logout.get('/:user', (req, res) => {
    let user = req.params.user;
    res.render('pages/logout', {user: user});
})

login.delete('/', (req, res) => {
    console.log('DeletedSesión: ', req.session);
    const user = req.user?.username;
    console.log('DeletedUsuario : ', user);
    req.session.destroy();
    res.send({
        user: user || 'Desconocido',
        eliminado: 'Ok'});
})
