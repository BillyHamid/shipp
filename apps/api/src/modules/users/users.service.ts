import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { User } from '@prisma/client'
import { PrismaService } from '../../common/prisma/prisma.service.js'
import { PasswordService } from '../auth/password.service.js'
import type { CreateUserDto } from '@gsg/shared-types/schemas'

export type SafeUser = Omit<User, 'passwordHash'>

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  async list(): Promise<(SafeUser & { role: { name: string; label: string } })[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { role: { select: { name: true, label: true } } },
    })
    return users.map(({ passwordHash: _passwordHash, ...safe }) => safe)
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const role = await this.prisma.role.findUnique({ where: { name: dto.role } })
    if (!role) throw new BadRequestException(`Unknown role '${dto.role}'`)

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } })
    if (existing) throw new BadRequestException('A user with this email already exists')

    const passwordHash = await this.passwords.hash(dto.password)
    const { passwordHash: _passwordHash, ...safe } = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        fullName: dto.fullName.trim(),
        roleId: role.id,
        country: dto.country ?? null,
      },
    })
    return safe
  }

  async setActive(id: string, active: boolean): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundException(`User ${id} not found`)
    const { passwordHash: _passwordHash, ...safe } = await this.prisma.user.update({
      where: { id },
      data: { active },
    })
    return safe
  }
}
