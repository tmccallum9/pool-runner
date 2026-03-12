import { gql } from '@apollo/client';

// Send magic link to user's email
export const SEND_MAGIC_LINK = gql`
  mutation SendMagicLink($email: String!) {
    sendMagicLink(email: $email) {
      success
    }
  }
`;

// Sign in using magic link token
export const SIGN_IN = gql`
  mutation SignIn($token: String!) {
    signIn(token: $token) {
      user {
        id
        email
        createdAt
      }
      authToken
    }
  }
`;
