import cors from 'cors';
import YAML from 'yamljs';
import router from './routes';
import { Morgan } from './shared/morgen';
import swaggerUi from 'swagger-ui-express';
import { StatusCodes } from 'http-status-codes';
import express, { Request, Response } from 'express';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import './config/passport'; // register strategy

const app = express();
import path from 'path';
import passport from 'passport';
//morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

//body parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

//file retrieve
app.use(express.static('uploads'));

// Load your swagger.yml from the public folder
const swaggerDocument = YAML.load(
  path.join(__dirname, '../public/swagger.yaml')
);

//router
app.use('/api/v1', router);

// Serve Swagger UI at /api/v1/docs
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//live response
app.get('/', (req: Request, res: Response) => {
  const date = new Date(Date.now());
  res.send(
    `<h1 style="text-align:center; color:#173616; font-family:Verdana;">Beep-beep! The server is alive and kicking.</h1>
    <p style="text-align:center; color:#173616; font-family:Verdana;">${date}</p>
    `
  );
});

//global error handle
app.use(globalErrorHandler);

//handle not found route;
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Not found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

export default app;
