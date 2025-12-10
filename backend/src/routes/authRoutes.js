import express from 'express';
import {
    login,
    logout,
    getMe,
    changePassword,
    updateProfile
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/update-profile', protect, updateProfile);

export default router;