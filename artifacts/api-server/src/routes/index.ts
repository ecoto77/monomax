import { Router, type IRouter } from "express";
import healthRouter from "./health";
import moviesRouter from "./movies";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(moviesRouter);

export default router;
