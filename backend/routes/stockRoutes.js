import express from 'express';
import { getAllStocks, addStock, openJsonFolder } from '../controllers/stockController.js';

const stockRouter = express.Router();

stockRouter.get('/', getAllStocks);

stockRouter.post('/add', addStock);

stockRouter.get('/open-json', openJsonFolder);

export { stockRouter };
