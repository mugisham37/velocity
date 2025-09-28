export type MainTabParamList = {
  Dashboard: undefined;
  Sales: undefined;
  Inventory: undefined;
  Finance: undefined;
  Profile: undefined;
};

export type SalesStackParamList = {
  SalesList: undefined;
  NewSale: undefined;
  SaleDetails: { id: string };
  CustomerSelect: undefined;
  ProductSelect: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
