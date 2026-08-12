import { Injectable } from '@nestjs/common'
import * as argon2 from 'argon2'

@Injectable()
export class PasswordService {
  /** Argon2id is the OWASP recommendation for password hashing (2025). */
  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 19_456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  }

  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options)
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain)
    } catch {
      return false
    }
  }

  /**
   * Indicates whether the existing hash should be re-computed
   * because parameters have changed since it was generated.
   */
  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash, this.options)
  }
}
