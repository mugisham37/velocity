import { NavigatorScreenParams } from '@react-navigation/native';

export type MainStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  Auth: undefined;
};

export type MainTabParamList = {
  Sales: NavigatorScreenParams<SalesStackParamList>;
  Settings: undefined;
  Home: undefined;
};

export type SalesStackParamList = {
  SalesList: undefined;
  SalesDetail: { id: string };
  CreateSale: undefined;
  CustomerList: undefined;
  CustomerDetail: { id: string };
  BarcodeScanner: { onScan: (data: string) => void };
};
