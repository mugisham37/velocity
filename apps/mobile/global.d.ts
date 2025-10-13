declare module 'react-native' {
  import * as React from 'react';

  export const View: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any>;
  export const RefreshControl: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const TouchableOpacity: React.ComponentType<any>;
  export const StyleSheet: any;
  export const Dimensions: any;
  export const Platform: any;
  export const Alert: any;
  export const useColorScheme: () => 'light' | 'dark' | null;
}

declare module '@react-native-community/netinfo' {
  const NetInfo: {
    addEventListener: (callback: (state: any) => void) => void;
    fetch: () => Promise<any>;
  };
  export default NetInfo;
}

declare module 'expo-device' {
  export const isDevice: boolean;
}

declare module 'expo-notifications' {
  export const setNotificationHandler: (handler: any) => void;
  export const getPermissionsAsync: () => Promise<any>;
  export const requestPermissionsAsync: () => Promise<any>;
  export const getExpoPushTokenAsync: () => Promise<{ data: string }>;
  export const addNotificationReceivedListener: (
    callback: (notification: any) => void
  ) => void;
  export const addNotificationResponseReceivedListener: (
    callback: (response: any) => void
  ) => void;
  export const scheduleNotificationAsync: (
    notification: any
  ) => Promise<string>;
  export const cancelScheduledNotificationAsync: (id: string) => Promise<void>;
  export const cancelAllScheduledNotificationsAsync: () => Promise<void>;
  export const setBadgeCountAsync: (count: number) => Promise<void>;

  export interface NotificationTriggerInput {
    seconds?: number;
    date?: Date;
    repeats?: boolean;
  }
}

declare module 'expo-camera' {
  export const Camera: React.ComponentType<any> & {
    requestCameraPermissionsAsync: () => Promise<{ status: string }>;
  };
  export const CameraType: any;
  export const FlashMode: any;
}

declare module 'react-native-paper' {
  import * as React from 'react';

  export const Provider: React.ComponentType<any>;
  export const TextInput: React.ComponentType<any> & {
    Icon: React.ComponentType<any>;
  };
  export const Button: React.ComponentType<any>;
  export const Card: React.ComponentType<any> & {
    Content: React.ComponentType<any>;
    Title: React.ComponentType<any>;
    Actions: React.ComponentType<any>;
  };
  export const Text: React.ComponentType<any>;
  export const IconButton: React.ComponentType<any>;
  export const ActivityIndicator: React.ComponentType<any>;
  export const Chip: React.ComponentType<any>;
  export const Divider: React.ComponentType<any>;
  export const FAB: React.ComponentType<any>;
  export const List: React.ComponentType<any> & {
    Item: React.ComponentType<any>;
    Icon: React.ComponentType<any>;
  };
  export const Menu: React.ComponentType<any> & {
    Item: React.ComponentType<any>;
  };
  export const ProgressBar: React.ComponentType<any>;
  export const useTheme: () => any;
  export const MD3DarkTheme: any;
  export const MD3LightTheme: any;
  export const configureFonts: (config: any) => any;
}

declare module '@hookform/resolvers/zod' {
  export const zodResolver: (schema: any) => any;
}
