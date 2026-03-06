import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/User';

export class UserService {
  async findAll(): Promise<User[]> {
    return UserRepository.find();
  }

  async findById(id: number): Promise<User | null> {
    return UserRepository.findOneBy({ id });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = UserRepository.create(data);
    return UserRepository.save(user);
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    await UserRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await UserRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

export const userService = new UserService();
