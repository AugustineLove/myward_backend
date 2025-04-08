// import { Router } from "express";
// import { getAllChildren, sendParentMessage, verifyParentNumber } from "../controllers/parentController.mjs";

// const parentRoutes = Router();

// parentRoutes.get("/:parentNumber", getAllChildren)
// parentRoutes.post("/verify", verifyParentNumber)
// parentRoutes.post('/sendMessage', sendParentMessage)
// export default parentRoutes;


import { Router } from "express";
import { getAllChildren, sendParentMessage, verifyParentNumber } from "../controllers/parentController.mjs";

const parentRoutes = Router();
parentRoutes.get('/:parentNumber', getAllChildren)
parentRoutes.post('/verify', verifyParentNumber)
parentRoutes.post('/sendMessage', sendParentMessage)


export default parentRoutes;