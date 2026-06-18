import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepository.create({ email: dto.email, passwordHash });
    await this.userRepository.save(user);
    return { accessToken: this.signToken(user) };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.validateUser(dto.email, dto.password);
    return { accessToken: this.signToken(user) };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email, isActive: true } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  private signToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }
}
