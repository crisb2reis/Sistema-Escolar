import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createStackNavigator();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="QRScanner" component={QRScannerScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;



