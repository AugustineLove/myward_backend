
import { Router } from "express";
import { addParentEmailToStudents, getAllChildren, sendParentMessage, verifyParentNumber } from "../controllers/parentController.mjs";

const parentRoutes = Router();
parentRoutes.get('/:parentNumber', getAllChildren)
parentRoutes.post('/verify', verifyParentNumber)
parentRoutes.post('/sendMessage', sendParentMessage)
parentRoutes.put('/addEmail', addParentEmailToStudents)


export default parentRoutes;