import { Camera, CameraType, FlashMode } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper';

import { databaseService } from '@services/database';

interface Props {
  navigation: any;
  route: {
    params: {
      onScan: (data: string) => void;
    };
  };
}

export default function BarcodeScannerScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const { onScan } = route.params;

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);

    try {
      // Try to find the product in local database
      const product = await databaseService.getProductByBarcode(data);

      if (product) {
        Alert.alert('Product Found', `${product.name} (${product.sku})`, [
          {
            text: 'Scan Again',
            onPress: () => setScanned(false),
          },
          {
            text: 'Use Product',
            onPress: () => {
              onScan(data);
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert(
          'Barcode Scanned',
          `Barcode: ${data}\nType: ${type}\n\nProduct not found in local database.`,
          [
            {
              text: 'Scan Again',
              onPress: () => setScanned(false),
            },
            {
              text: 'Use Anyway',
              onPress: () => {
                onScan(data);
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error looking up product:', error);
      Alert.alert('Barcode Scanned', `Barcode: ${data}\nType: ${type}`, [
        {
          text: 'Scan Again',
          onPress: () => setScanned(false),
        },
        {
          text: 'Use Barcode',
          onPress: () => {
            onScan(data);
            navigation.goBack();
          },
        },
      ]);
    }
  };

  if (hasPermission === null) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Card style={styles.messageCard}>
          <Card.Content style={styles.messageContent}>
            <Text
              variant='bodyLarge'
              style={[styles.messageText, { color: theme.colors.onSurface }]}
            >
              Requesting camera permission...
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Card style={styles.messageCard}>
          <Card.Content style={styles.messageContent}>
            <Text
              variant='headlineSmall'
              style={[styles.messageTitle, { color: theme.colors.error }]}
            >
              Camera Permission Required
            </Text>
            <Text
              variant='bodyLarge'
              style={[styles.messageText, { color: theme.colors.onSurface }]}
            >
              Camera access is required to scan barcodes. Please enable camera
              permission in your device settings.
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
    <View style={styles.container}>
      <Camera
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        type={CameraType.back}
        flashMode={flashOn ? FlashMode.on : FlashMode.off}
        barCodeScannerSettings={{
          barCodeTypes: ['qr'],
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View
          style={[styles.header, { backgroundColor: theme.colors.surface }]}
        >
          <IconButton
            icon='close'
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text
            variant='titleMedium'
            style={[styles.headerTitle, { color: theme.colors.onSurface }]}
          >
            Scan Barcode
          </Text>
          <IconButton
            icon={flashOn ? 'flash' : 'flash-off'}
            size={24}
            onPress={() => setFlashOn(!flashOn)}
          />
        </View>

        {/* Scanning Frame */}
        <View style={styles.scanningArea}>
          <View
            style={[styles.scanFrame, { borderColor: theme.colors.primary }]}
          >
            <View
              style={[
                styles.corner,
                styles.topLeft,
                { borderColor: theme.colors.primary },
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.topRight,
                { borderColor: theme.colors.primary },
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.bottomLeft,
                { borderColor: theme.colors.primary },
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.bottomRight,
                { borderColor: theme.colors.primary },
              ]}
            />
          </View>
        </View>

        {/* Instructions */}
        <View
          style={[
            styles.instructions,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            variant='bodyLarge'
            style={[styles.instructionText, { color: theme.colors.onSurface }]}
          >
            Position the barcode within the frame to scan
          </Text>

          {scanned && (
            <Button
              mode='contained'
              onPress={() => setScanned(false)}
              style={styles.scanAgainButton}
            >
              Scan Again
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    elevation: 4,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderRadius: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  instructions: {
    padding: 24,
    alignItems: 'center',
    elevation: 4,
  },
  instructionText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  scanAgainButton: {
    marginTop: 8,
  },
  messageCard: {
    margin: 24,
  },
  messageContent: {
    alignItems: 'center',
    padding: 24,
  },
  messageTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  messageText: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    minWidth: 120,
  },
});
