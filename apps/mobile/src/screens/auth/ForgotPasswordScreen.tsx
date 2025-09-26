import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';

import { authService } from '@services/auth';
import { getErrorMessage } from '@utils/helpers';
import {
  ForgotPasswordFormData,
  forgotPasswordSchema,
} from '@utils/validation';

export default function ForgotPasswordScreen({ navigation }: any) {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);

      Alert.alert(
        'Reset Link Sent',
        'A password reset link has been sent to your email address. Please check your inbox and follow the instructions.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert('Reset Failed', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text
          variant='headlineMedium'
          style={[styles.title, { color: theme.colors.primary }]}
        >
          Forgot Password
        </Text>
        <Text
          variant='bodyLarge'
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Enter your email address and we'll send you a link to reset your
          password.
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

          <Button
            mode='contained'
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.resetButton}
          >
            Send Reset Link
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Text
          style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}
        >
          Remember your password?
        </Text>
        <Button
          mode='text'
          onPress={() => navigation.navigate('Login')}
          compact
        >
          Sign In
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
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
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
  resetButton: {
    marginTop: 16,
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
