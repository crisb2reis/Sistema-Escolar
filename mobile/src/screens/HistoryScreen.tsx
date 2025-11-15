import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Attendance {
  id: string;
  session_id: string;
  timestamp: string;
  method: string;
}

const HistoryScreen: React.FC = () => {
  const { user } = useAuth();

  const { data: attendances, isLoading } = useQuery<Attendance[]>({
    queryKey: ['attendances', user?.id],
    queryFn: async () => {
      const response = await api.get(`/reports/students/${user?.id}/attendance`);
      return response.data;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico de Presenças</Text>
      <FlatList
        data={attendances}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
            <Text style={styles.itemSubtext}>Método: {item.method}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma presença registrada</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
  },
});

export default HistoryScreen;



