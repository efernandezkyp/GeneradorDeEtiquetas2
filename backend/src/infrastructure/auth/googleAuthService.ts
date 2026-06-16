import { OAuth2Client } from 'google-auth-library';
import { IGoogleAuthService } from '../../domain/interfaces';
import { config } from '../../config';
import { UnauthorizedError } from '../../domain/errors';

export class GoogleAuthService implements IGoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(
      config.google.clientId,
      config.google.clientSecret,
      config.google.callbackUrl,
    );
  }

  getAuthUrl(): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'consent',
    });
  }

  async getTokensFromCode(code: string): Promise<{ idToken: string }> {
    const { tokens } = await this.client.getToken(code);
    if (!tokens.id_token) {
      throw new UnauthorizedError('No se pudo obtener el token de Google');
    }
    return { idToken: tokens.id_token };
  }

  async verifyIdToken(idToken: string): Promise<{
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
  }> {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedError('Token de Google inválido');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name ?? '',
      lastName: payload.family_name ?? '',
    };
  }
}
