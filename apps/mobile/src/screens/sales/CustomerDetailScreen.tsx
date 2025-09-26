import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function CustomerDetailScreen() {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text
        variant='headlineMedium'
        style={[styles.title, { color: theme.colors.onSurface }]}
      >
        Customer Details
      </Text>
      <Text
        variant='bodyLarge'
        style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        Coming soon...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
  },
});
