import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

const userRepo = AppDataSource.getRepository(User);

export class AuthService {
  async register(username: string, email: string, password: string, phone?: string): Promise<User> {
    const existingUsername = await userRepo.findOneBy({ username });
    if (existingUsername) throw new Error('USERNAME_EXISTS');
    const user = userRepo.create({ username, email, password, phone });
    return userRepo.save(user);
  }

  async login(username: string, password: string): Promise<string> {
    const user = await userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();

    if (!user || user.password !== password) throw new Error('INVALID_CREDENTIALS');
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return token;
  }
  
  async findById(id: number): Promise<Omit<User, 'password'> | null> {
    // Omit去掉 password 字段
    return userRepo.findOneBy({ id });
  }
}

export const authService = new AuthService();
