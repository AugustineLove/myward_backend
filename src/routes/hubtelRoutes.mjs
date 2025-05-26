import { Router } from "express";
import { hubtelCheckout, hubtelWebhookUrl, verifyHubtelPayment } from "../controllers/hubtelController.mjs";



export const hubtelRoutes = Router()


hubtelRoutes.post('/webhook/hubtel-payment', hubtelWebhookUrl)
hubtelRoutes.post('/checkout', hubtelCheckout)
hubtelRoutes.get('/verify/:clientReference/:schoolId', verifyHubtelPayment)