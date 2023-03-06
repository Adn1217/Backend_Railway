import winston from 'winston';
const {combine, timestamp, prettyPrint, colorize} = winston.format;

const myColors = {
    info: 'gray',
    warn: 'yellow',
    error: 'red'
}

const ignoreErrorOnWarn = winston.format((info) => {
    if(info.level === 'warn'){
        return info;
    }
    return false;
})

function buildDefaultLogger(){
    const devLogger = winston.createLogger({
        level: 'debug',
        format: combine(timestamp(), prettyPrint()),
        transports: [
            new winston.transports.Console({level: 'info',
                format: combine(colorize(),timestamp(),  
                     winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
                )
            }),
            new winston.transports.File({
                format: combine(ignoreErrorOnWarn(), timestamp(), prettyPrint()),
                filename: './logs/warn.log', level: 'warn'}),
            new winston.transports.File({filename: './logs/error.log', level: 'error'}),
        ]
    })
    winston.addColors(myColors);
    return devLogger;
}

function buildProdLogger(){
    const prodLogger = winston.createLogger({
        level: 'info',
        format: combine(timestamp(), prettyPrint()),
        transports: [
            // new winston.transports.Console({level: 'Info'}),
            new winston.transports.File({
                format: combine(ignoreErrorOnWarn(), timestamp(), prettyPrint()),filename: './logs/warnProd.log', level: 'warn'}),
            new winston.transports.File({filename: './logs/errorProd.log', level: 'error'}),
        ]
    })
    winston.addColors(myColors);
    return prodLogger;
}

let logger = buildDefaultLogger();

if(process.env.NODE_ENV === 'prod'){
    logger = buildProdLogger();
}

export default logger;