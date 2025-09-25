import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { UsersService } from '../../users/users.service';

export interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

@Injectable()
export class MfaService {
  constructor(private readonly usersService: UsersService) {}

  async generateMfaSecret(userId: string): Promise<MFASetup> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // Generate service name for QR code
    const serviceName = 'KIRO ERP';
    const accountName = user.email;

    // Generate otpauth URL
    const otpauthUrl = authenticator.keyuri(accountName, serviceName, secret);

    // Generate QR code
    const qrCodeUrl = await toDataURL(otpauthUrl);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store MFA secret (but don't enable yet)
    await this.usersService.storeMfaSecret(userId, secret, backupCodes);

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  }

  async enableMfa(userId: string, token: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.mfaSecret) {
      throw new Error('MFA setup not initiated');
    }

    // Verify the token
    const isValid = authenticator.verify({
      token,
      secret: user.mfaSecret,
      window: 2, // Allow 2 time steps (60 seconds) tolerance
    });

    if (!isValid) {
      return false;
    }

    // Enable MFA for the user
    await this.usersService.enableMfa(userId);

    return true;
  }

  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return false;
    }

    // Check if it's a backup code
    if (token.length === 8 && /^[A-Z0-9]{8}$/.test(token)) {
      return this.verifyBackupCode(userId, token);
    }

    // Verify TOTP token
    return authenticator.verify({
      token,
      secret: user.mfaSecret,
      window: 2,
    });
  }

  async disableMfa(userId: string, token: string): Promise<boolean> {
    const isValid = await this.verifyMfaToken(userId, token);
    if (!isValid) {
      return false;
    }

    await this.usersService.disableMfa(userId);
    return true;
  }

  async regenerateBackupCodes(
    userId: string,
    token: string
  ): Promise<string[]> {
    const isValid = await this.verifyMfaToken(userId, token);
    if (!isValid) {
      throw new Error('Invalid MFA token');
    }

    const backupCodes = this.generateBackupCodes();
    await this.usersService.updateBackupCodes(userId, backupCodes);

    return backupCodes;
  }

  private async verifyBackupCode(
    userId: string,
    code: string
  ): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.mfaBackupCodes) {
      return false;
    }

    const backupCodes = JSON.parse(user.mfaBackupCodes);
    const codeIndex = backupCodes.indexOf(code);

    if (codeIndex === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(codeIndex, 1);
    await this.usersService.updateBackupCodes(userId, backupCodes);

    return true;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < 10; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(code);
    }

    return codes;
  }
}
