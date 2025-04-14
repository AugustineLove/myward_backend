import { Router } from "express";
import { postHelp } from "../controllers/helpController.mjs";

const helpRoutes = Router();

helpRoutes.post('/', postHelp)

export default helpRoutes;