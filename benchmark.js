import autocannon from 'autocannon';
import stream from 'stream';
import logger from './logger.js';

function run(url){
    logger.info(`Inicio de pruebas Benchmark para ${url}`);
    const buf =[];
    const outputStream = new stream.PassThrough();

    const inst = autocannon({
        url,
        connections: 100,
        duration: 20
    })

    autocannon.track(inst, {outputStream});

    outputStream.on('data', data => buf.push(data));
    inst.on('done', () => {
        logger.info(`Fin de pruebas Benchmark para ${url}`);
        process.stdout.write(Buffer.concat(buf));
    })
}

// run('http://localhost/randoms/?cant=20');
run('http://localhost/randoms/sync?cant=20');