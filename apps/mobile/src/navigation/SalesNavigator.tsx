import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';

import BarcodeScannerScreen from '@screens/common/BarcodeScannerScreen';
import CreateSaleScreen from '@screens/sales/CreateSaleScreen';
import CustomerDetailScreen from '@screens/sales/CustomerDetailScreen';
import CustomerListScreen from '@screens/sales/CustomerListScreen';
import SalesDetailScreen from '@screens/sales/SalesDetailScreen';
import SalesListScreen from '@screens/sales/SalesListScreen';
import { SalesStackParamList } from '@types/index';

const Stack = createNativeStackNavigator<SalesStackParamList>();

export default function SalesNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName='SalesList'
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name='SalesList'
        component={SalesListScreen}
        options={{ title: 'Sales Orders' }}
      />
      <Stack.Screen
        name='SalesDetail'
        component={SalesDetailScreen}
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen
        name='CreateSale'
        component={CreateSaleScreen}
        options={{ title: 'Create Order' }}
      />
      <Stack.Screen
        name='CustomerList'
        component={CustomerListScreen}
        options={{ title: 'Customers' }}
      />
      <Stack.Screen
        name='CustomerDetail'
        component={CustomerDetailScreen}
        options={{ title: 'Customer Details' }}
      />
      <Stack.Screen
        name='BarcodeScanner'
        component={BarcodeScannerScreen}
        options={{
          title: 'Scan Barcode',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
