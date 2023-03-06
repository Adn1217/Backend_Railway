import {randomCount} from './functions.js';

process.on('message', cant => {
    
    if(cant) {
        process.send(`Se inicia proceso de conteo para una cantidad de ${cant} números. Este proceso puede tardar varios minutos. Para una cantidad de cien mil números el proceso tarda alrededor de 5 min.`);
        let conteo = randomCount(cant);
        process.send(conteo);
        process.exit();
    }
})

process.on('exit', () => {
    console.log('Hilo terminado');
})

process.send('Listo');