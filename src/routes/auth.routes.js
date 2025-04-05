// src/routes/auth.routes.ts
import { Router } from 'express';
import { loginUser } from "../controllers/login.controller.js";
import { refreshToken, handleLogout } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.post('/logout', authMiddleware, handleLogout);

export default router;