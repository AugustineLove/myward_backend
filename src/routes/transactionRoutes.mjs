
import { Router } from "express";
import { createTransaction, getAllTransactions, getTransactions, globalTransactions } from "../controllers/transactionController.mjs";

const transactionRoutes = Router();

transactionRoutes.post('/:studentId', createTransaction)
transactionRoutes.get('/:studentId', getTransactions)
transactionRoutes.get('/trans/filterTransaction', getAllTransactions)
transactionRoutes.get('/', globalTransactions)

export default transactionRoutes;