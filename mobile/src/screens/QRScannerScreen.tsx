import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

const QRScannerScreen: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const checkInMutation = useMutation({
    mutationFn: async (token: string) => {
      try {
        console.log('Iniciando check-in com token...');
        const deviceId = Platform.OS + '-' + Platform.Version;
        console.log('Device ID:', deviceId);
        
        const response = await api.post('/checkin', {
          token,
          device_id: deviceId,
        });
        
        console.log('Check-in realizado com sucesso:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('Erro na requisição de check-in:', error);
        console.error('Erro response:', error.response?.data);
        console.error('Erro status:', error.response?.status);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Check-in bem-sucedido:', data);
      Alert.alert('Sucesso', 'Presença registrada com sucesso!');
      setScanned(false);
    },
    onError: (error: any) => {
      console.error('Erro no check-in:', error);
      const errorMessage = 
        error.response?.data?.detail || 
        error.message || 
        'Erro ao registrar presença. Verifique sua conexão e tente novamente.';
      
      Alert.alert('Erro', errorMessage);
      setScanned(false);
    },
  });

  const handleBarCodeScanned = ({ data, type }: { data: string; type: string }) => {
    // Prevenir múltiplos escaneamentos
    if (scanned || checkInMutation.isPending) {
      return;
    }
    
    // Validar dados recebidos
    if (!data || typeof data !== 'string' || data.trim().length === 0) {
      console.error('QR Code vazio ou inválido');
      Alert.alert('Erro', 'QR Code inválido. Tente escanear novamente.');
      return;
    }
    
    try {
      setScanned(true);
      
      // Log seguro (sem substring se for muito curto)
      const preview = data.length > 50 ? data.substring(0, 50) + '...' : data;
      console.log('QR Code escaneado (tipo:', type, '):', preview);
      
      // Extrair token do deep link ou usar token direto
      let token: string | null = null;
      
      // Se for um deep link, extrair o token
      // Formato: frequenciaescolar://checkin?token=TOKEN
      if (data.startsWith('frequenciaescolar://checkin')) {
        try {
          // Extrair token do query string manualmente
          const tokenMatch = data.match(/[?&]token=([^&]+)/);
          if (tokenMatch && tokenMatch[1]) {
            try {
              token = decodeURIComponent(tokenMatch[1]);
              console.log('Token extraído do deep link (tamanho:', token.length, ')');
            } catch (decodeError) {
              // Se falhar ao decodificar, usar o token sem decodificar
              token = tokenMatch[1];
              console.log('Token usado sem decodificação (tamanho:', token.length, ')');
            }
          } else {
            console.warn('Token não encontrado no deep link');
            Alert.alert('Erro', 'Token não encontrado no QR Code. Gere um novo QR Code.');
            setScanned(false);
            return;
          }
        } catch (e) {
          console.error('Erro ao processar deep link:', e);
          Alert.alert('Erro', 'Erro ao processar QR Code. Tente novamente.');
          setScanned(false);
          return;
        }
      } else {
        // Se não for deep link, assumir que é o token direto
        console.log('Usando token direto do QR code (tamanho:', data.length, ')');
        token = data.trim();
      }
      
      // Validar token antes de enviar
      if (!token || token.length === 0) {
        console.error('Token vazio após processamento');
        Alert.alert('Erro', 'Token inválido no QR Code. Gere um novo QR Code.');
        setScanned(false);
        return;
      }
      
      // Verificar se o token parece ser um JWT (começa com eyJ)
      if (!token.startsWith('eyJ')) {
        console.warn('Token não parece ser um JWT válido:', token.substring(0, 20));
        // Mesmo assim, tentar enviar (pode ser um formato diferente)
      }
      
      console.log('Enviando token para check-in (primeiros 20 chars):', token.substring(0, 20) + '...');
      checkInMutation.mutate(token);
      
    } catch (error) {
      console.error('Erro ao processar QR code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Detalhes do erro:', errorMessage);
      
      Alert.alert(
        'Erro',
        `Erro ao processar QR code: ${errorMessage}\n\nTente escanear novamente ou gere um novo QR Code.`
      );
      setScanned(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Permissão da câmera necessária</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Solicitar Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      {(checkInMutation.isPending || scanned) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
            {checkInMutation.isPending ? 'Processando check-in...' : 'QR Code escaneado'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QRScannerScreen;

