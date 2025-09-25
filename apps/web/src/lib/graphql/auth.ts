import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        firstName
        lastName
        isActive
        companyId
      }
      accessToken
      refreshToken
      requiresMfa
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      user {
        id
        email
        firstName
        lastName
        isActive
        companyId
      }
      accessToken
      refreshToken
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const SETUP_MFA_MUTATION = gql`
  mutation SetupMfa {
    setupMfa {
      secret
      qrCodeUrl
      backupCodes
    }
  }
`;

export const ENABLE_MFA_MUTATION = gql`
  mutation EnableMfa($input: EnableMfaInput!) {
    enableMfa(input: $input)
  }
`;

export const DISABLE_MFA_MUTATION = gql`
  mutation DisableMfa($input: DisableMfaInput!) {
    disableMfa(input: $input)
  }
`;

export const REGENERATE_BACKUP_CODES_MUTATION = gql`
  mutation RegenerateBackupCodes($input: RegenerateBackupCodesInput!) {
    regenerateBackupCodes(input: $input) {
      backupCodes
    }
  }
`;
