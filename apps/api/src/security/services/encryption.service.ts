import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag: string;
}

export interface FieldEncryptionConfig {
  algorithm: string;
  keyDerivation: 'pbkdf2' | 'scrypt';
  iterations?: number;
  saltLength: number;
}

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly saltLength = 32;

  private readonly masterKey: Buffer;
  private readonly fieldEncryptionKey: Buffer;

  constructor(
    private reconfigService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    // Initialize encryption keys from environment
    const masterKeyHex = this.configService.get<string>(
      'ENCRYPTION_MASTER_KEY'
    );
    const fieldKeyHex = this.configService.get<string>('FIELD_ENCRYPTION_KEY');

    if (!masterKeyHex || !fieldKeyHex) {
      throw new Error(
        'Encryption keys not configured. Set ENCRYPTION_MASTER_KEY and FIELD_ENCRYPTION_KEY'
      );
    }

    this.masterKey = Buffer.from(masterKeyHex, 'hex');
    this.fieldEncryptionKey = Buffer.from(fieldKeyHex, 'hex');

    if (
      this.masterKey.length !== this.keyLength ||
      this.fieldEncryptionKey.length !== this.keyLength
    ) {
      throw new Error('Encryption keys must be 32 bytes (64 hex characters)');
    }
  }

  /**
   * Encrypt data at rest using AES-256-GCM
   */
  async encryptData(data: string, key?: Buffer): Promise<EncryptionResult> {
    try {
      const encryptionKey = key || this.masterKey;
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, encryptionKey, { iv });

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      this.logger.error('Failed to encrypt data', { error });
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data at rest
   */
  async decryptData(
    encryptedData: string,
    iv: string,
    tag: string,
    key?: Buffer
  ): Promise<string> {
    try {
      const encryptionKey = key || this.masterKey;
      const decipher = crypto.createDecipher(this.algorithm, encryptionKey, {
        iv: Buffer.from(iv, 'hex'),
      });

      decipher.setAuthTag(Buffer.from(tag, 'hex'));

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt data', { error });
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt sensitive database fields
   */
  async encryptField(value: string, fieldName: string): Promise<string> {
    try {
      // Derive field-specific key
      const fieldKey = this.deriveFieldKey(fieldName);
      const result = await this.encryptData(value, fieldKey);

      // Return as single string with metadata
      return `${result.iv}:${result.tag}:${result.encrypted}`;
    } catch (error) {
      this.logger.error('Failed to encrypt field', { fieldName, error });
      throw error;
    }
  }

  /**
   * Decrypt sensitive database fields
   */
  async decryptField(
    encryptedValue: string,
    fieldName: string
  ): Promise<string> {
    try {
      const [iv, tag, encrypted] = encryptedValue.split(':');
      if (!iv || !tag || !encrypted) {
        throw new Error('Invalid encrypted field format');
      }

      const fieldKey = this.deriveFieldKey(fieldName);
      return await this.decryptData(encrypted, iv, tag, fieldKey);
    } catch (error) {
      this.logger.error('Failed to decrypt field', { fieldName, error });
      throw error;
    }
  }

  /**
   * Hash passwords with bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate API key with prefix
   */
  generateApiKey(prefix: string = 'kiro'): string {
    const randomPart = crypto.randomBytes(24).toString('base64url');
    return `${prefix}_${randomPart}`;
  }

  /**
   * Hash API key for storage
   */
  async hashApiKey(apiKey: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(apiKey, salt, 100000, 64, 'sha512')
      .toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify API key against hash
   */
  async verifyApiKey(apiKey: string, storedHash: string): Promise<boolean> {
    try {
      const [salt, hash] = storedHash.split(':');
      const computedHash = crypto
        .pbkdf2Sync(apiKey, salt, 100000, 64, 'sha512')
        .toString('hex');
      return crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(computedHash, 'hex')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Encrypt data for transmission (TLS additional layer)
   */
  async encryptForTransmission(data: any): Promise<string> {
    const jsonData = JSON.stringify(data);
    const result = await this.encryptData(jsonData);
    return Buffer.from(JSON.stringify(result)).toString('base64');
  }

  /**
   * Decrypt data from transmission
   */
  async decryptFromTransmission(encryptedData: string): Promise<any> {
    const result = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
    const decrypted = await this.decryptData(
      result.encrypted,
      result.iv,
      result.tag
    );
    return JSON.parse(decrypted);
  }

  /**
   * Generate encryption key pair for asymmetric encryption
   */
  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Encrypt with public key (for key exchange)
   */
  encryptWithPublicKey(data: string, publicKey: string): string {
    return crypto
      .publicEncrypt(publicKey, Buffer.from(data))
      .toString('base64');
  }

  /**
   * Decrypt with private key
   */
  decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
    return crypto
      .privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64'))
      .toString();
  }

  /**
   * Create HMAC signature for data integrity
   */
  createSignature(data: string, secret?: string): string {
    const key = secret || this.masterKey.toString('hex');
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifySignature(data: string, signature: string, secret?: string): boolean {
    const key = secret || this.masterKey.toString('hex');
    const expectedSignature = crypto
      .createHmac('sha256', key)
      .update(data)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Derive field-specific encryption key
   */
  private deriveFieldKey(fieldName: string): Buffer {
    const salt = crypto.createHash('sha256').update(fieldName).digest();
    return crypto.pbkdf2Sync(
      this.fieldEncryptionKey,
      salt,
      100000,
      this.keyLength,
      'sha256'
    );
  }

  /**
   * Generate master key (for initial setup)
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Rotate encryption keys (for key management)
   */
  async rotateKeys(): Promise<{ masterKey: string; fieldKey: string }> {
    this.logger.warn(
      'Key rotation initiated - this requires careful coordination'
    );

    return {
      masterKey: EncryptionService.generateMasterKey(),
      fieldKey: EncryptionService.generateMasterKey(),
    };
  }
}
