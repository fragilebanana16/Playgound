import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
});

const updateUserSchema = createUserSchema.partial();

export class UserController {
  async getAll(_req: Request, res: Response) {
    const users = await userService.findAll();
    res.json({ data: users });
  }

  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const user = await userService.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ data: user });
  }

  async create(req: Request, res: Response) {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }
    try {
      const user = await userService.create(parsed.data);
      res.status(201).json({ data: user });
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(409).json({ message: 'Email already exists' });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const user = await userService.update(id, parsed.data);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ data: user });
  }

  async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const deleted = await userService.delete(id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.status(204).send();
  }
}

export const userController = new UserController();
