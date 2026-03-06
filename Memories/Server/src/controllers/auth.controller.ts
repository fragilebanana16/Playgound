import { Request, Response } from 'express';

interface AuthRequest extends Request {
  userId?: number;
}
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse'

const registerSchema = z.object({
  username: z.string().min(1).max(100),
  email: z.string().optional(),
  password: z.string().min(1),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1),
});

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export class AuthController {
  async register(req: Request, res: Response) {
    console.log('tf')
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }
    try {
      const { username, email, password, phone } = parsed.data;
      const user = await authService.register(username, password, email, phone);
      const { password: _, ...safe } = user as any;
      res.status(201).json({ data: safe });
    } catch (err: any) {
      if (err.message === 'EMAIL_EXISTS') {
        return res.status(409).json({ message: 'Email already exists' });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  }

    async login(req: Request, res: Response): Promise<void> {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json(ApiResponse.error(JSON.stringify(parsed.error.flatten())));
        return;
      }

      try {
        const { username, password } = parsed.data;
        const token = await authService.login(username, password);
        res.json(ApiResponse.success({ token }));
      } catch (err: any) {
        if (err.message === 'INVALID_CREDENTIALS') {
          res.status(401).json(ApiResponse.error('Invalid name or password'));
          return;
        }
        res.status(500).json(ApiResponse.error('Internal server error'));
      }
    }
    
    async me(req: AuthRequest, res: Response): Promise<void> {
      try {
        const user = await authService.findById(req.userId!);
        if (!user) {
          res.status(404).json(ApiResponse.error('User not found'));
          return;
        }
        res.json(ApiResponse.success({
          userId: user.id,
          userName: user.username,
          roles: ['R_SUPER'],
          buttons: ['B_CODE1', 'B_CODE2'],
          email: user.email,
        }));
      } catch {
        res.status(500).json(ApiResponse.error('Internal server error'));
      }
    }
}

export const authController = new AuthController();
