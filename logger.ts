import { transports, createLogger, format } from "winston";


const logPath = process.env.LOG_PATH;


export const logger = createLogger({
    level: 'debug',
    format: format.combine(
        format.timestamp(), 
        format.json()
    ),
    defaultMeta: {},
    transports: [
        new transports.Console(),
        new transports.File({ filename: logPath }),
    ],
});
  