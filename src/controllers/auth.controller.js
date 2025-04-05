// src/controllers/auth.controller.ts
import { refreshAccessToken, logout } from "../services/auth.service.js";

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token não fornecido' });
    }
    
    const result = await refreshAccessToken(refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const handleLogout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = (req).user;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token não fornecido' });
    }
    
    await logout(user.id, refreshToken);
    res.status(200).json({ message: 'Logout realizado com sucesso' });
  } catch (err) {
    next(err);
  }
};