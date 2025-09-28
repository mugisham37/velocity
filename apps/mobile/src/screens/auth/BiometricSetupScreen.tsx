import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper';

import { useAuthStore } from '@store/auth';
import { getErrorMessage } from '@utils/helpers';

export default function BiometricSetupScreen({ navigation }: any) {
  const theme = useTheme();
  const { enableBiometric, disableBiometric, isBiometricEnabled } =
    useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      setIsSupported(hasHardware && isEnrolled);

      if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        setBiometricType('Face ID');
      } else if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        )
      ) {
        setBiometricType('Fingerprint');
      } else {
        setBiometricType('Biometric');
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setIsSupported(false);
    }
  };

  const handleEnableBiometric = async () => {
    setIsLoading(true);
    try {
      await enableBiometric();
      Alert.alert(
        'Biometric Authentication Enabled',
        `${biometricType} authentication has been enabled for your account.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Setup Failed', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableBiometric = async () => {
    Alert.alert(
      'Disable Biometric Authentication',
      `Are you sure you want to disable ${biometricType} authentication?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await disableBiometric();
              Alert.alert(
                'Biometric Authentication Disabled',
                `${biometricType} authentication has been disabled.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  const getBiometricIcon = () => {
    if (biometricType === 'Face ID') {
      return 'face-recognition';
    } else if (biometricType === 'Fingerprint') {
      return 'fingerprint';
    }
    return 'security';
  };

  if (!isSupported) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            <IconButton
              icon='alert-circle'
              size={64}
              iconColor={theme.colors.error}
            />
            <Text
              variant='headlineSmall'
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              Biometric Not Available
            </Text>
            <Text
              variant='bodyLarge'
              style={[
                styles.description,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Biometric authentication is not available on this device or no
              biometric data is enrolled.
            </Text>
            <Button
              mode='contained'
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <IconButton
            icon={getBiometricIcon()}
            size={64}
            iconColor={theme.colors.primary}
          />
          <Text
            variant='headlineSmall'
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            {biometricType} Authentication
          </Text>
          <Text
            variant='bodyLarge'
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {isBiometricEnabled
              ? `${biometricType} authentication is currently enabled for your account. You can use it to quickly sign in to KIRO ERP.`
              : `Enable ${biometricType} authentication for quick and secure access to your KIRO ERP account.`}
          </Text>

          {isBiometricEnabled ? (
            <Button
              mode='outlined'
              onPress={handleDisableBiometric}
              style={styles.button}
              buttonColor={theme.colors.errorContainer}
              textColor={theme.colors.error}
            >
              Disable {biometricType}
            </Button>
          ) : (
            <Button
              mode='contained'
              onPress={handleEnableBiometric}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              Enable {biometricType}
            </Button>
          )}

          <Button
            mode='text'
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Go Back
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    elevation: 4,
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    marginBottom: 16,
    minWidth: 200,
  },
  backButton: {
    marginTop: 8,
  },
});
