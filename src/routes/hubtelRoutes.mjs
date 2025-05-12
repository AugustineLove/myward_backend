import { Router } from "express";
import webhoookUrl from "../controllers/hubtelController.mjs";



const hubtelRoutes = Router()


hubtelRoutes.post('/webhook/hubtel-payment', webhoookUrl)