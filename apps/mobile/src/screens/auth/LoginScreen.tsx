import { zodResolver } from '@hookform/resolvers/zod';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Divider,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { useAuthStore } from '@store/auth';
import { getErrorMessage } from '@utils/helpers';
import { LoginFormData, loginSchema } from '@utils/validation';

export default function LoginScreen({ navigation }: any) {
  const theme = useTheme();
  const { login, loginWithBiometric, isBiometricEnabled } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
    } catch (error) {
      Alert.alert('Login Failed', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      await loginWithBiometric();
    } catch (error) {
      Alert.alert('Biometric Login Failed', getErrorMessage(error));
    }
  };

  const checkBiometricSupport = async () => {
    const biometricType = await LocalAuthentication.getEnrolledLevelAsync();
    return biometricType > 0;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text
          variant='headlineLarge'
          style={[styles.title, { color: theme.colors.primary }]}
        >
          KIRO ERP
        </Text>
        <Text
          variant='bodyLarge'
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Sign in to your account
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Controller
            control={control}
            name='email'
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label='Email'
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!errors.email}
                keyboardType='email-address'
                autoCapitalize='none'
                autoComplete='email'
                style={styles.input}
                left={<TextInput.Icon icon='email' />}
              />
            )}
          />
          {errors.email && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.email.message}
            </Text>
          )}

          <Controller
            control={control}
            name='password'
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label='Password'
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!errors.password}
                secureTextEntry={!showPassword}
                autoComplete='password'
                style={styles.input}
                left={<TextInput.Icon icon='lock' />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
            )}
          />
          {errors.password && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.password.message}
            </Text>
          )}

          <Button
            mode='contained'
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
          >
            Sign In
          </Button>

          {isBiometricEnabled && (
            <>
              <Divider style={styles.divider} />
              <Button
                mode='outlined'
                onPress={handleBiometricLogin}
                icon='fingerprint'
                style={styles.biometricButton}
              >
                Use Biometric Authentication
              </Button>
            </>
          )}

          <Button
            mode='text'
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotButton}
          >
            Forgot Password?
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Text
          style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}
        >
          Don't have an account?
        </Text>
        <Button
          mode='text'
          onPress={() => navigation.navigate('Register')}
          compact
        >
          Sign Up
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  card: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 16,
  },
  loginButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  biometricButton: {
    marginBottom: 8,
  },
  forgotButton: {
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    marginRight: 8,
  },
});
