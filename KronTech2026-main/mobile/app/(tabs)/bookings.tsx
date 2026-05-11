import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 1. Definim interfața completă pentru o rezervare
interface Booking {
  id: string;
  address: string;
  date: string;
  time: string;
  status: 'activ' | 'finalizat' | 'anulat';
  price: number;
  spotNumber: string;
  licensePlate: string;
}

// 2. Date de test actualizate cu locul de parcare și nr. de înmatriculare
const MOCK_BOOKINGS: Booking[] = [
  { id: '1', address: 'Str. Lunga nr. 10', date: '12 Mai 2026', time: '10:00 - 14:00', status: 'activ', price: 15, spotNumber: 'A-24', licensePlate: 'BV 22 ABC' },
  { id: '2', address: 'Bvd. Eroilor nr. 5', date: '10 Mai 2026', time: '18:00 - 20:00', status: 'finalizat', price: 10, spotNumber: '15', licensePlate: 'B 101 XYZ' },
  { id: '3', address: 'Str. Muresenilor nr. 1', date: '08 Mai 2026', time: '09:00 - 11:00', status: 'anulat', price: 0, spotNumber: 'B-12', licensePlate: 'BV 22 ABC' },
  { id: '4', address: 'Piața Sfatului', date: '15 Mai 2026', time: '14:00 - 16:00', status: 'activ', price: 20, spotNumber: 'VIP 1', licensePlate: 'CJ 99 ZZZ' },
];

export default function BookingsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'istoric'>('active');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const filteredBookings = MOCK_BOOKINGS.filter((booking) => {
    if (activeTab === 'active') {
      return booking.status === 'activ';
    } else {
      return booking.status === 'finalizat' || booking.status === 'anulat';
    }
  });

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const statusColor = 
      item.status === 'activ' ? '#4CAF50' : 
      item.status === 'finalizat' ? '#9E9E9E' : 
      '#F44336'; 

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.addressContainer}>
            <Ionicons name="location-sharp" size={18} color="#E74C3C" />
            <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
          </View>
          <Text style={[styles.status, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
        </View>
        
        {/* Body cu 2 coloane */}
        <View style={styles.cardBody}>
          {/* Coloana Stângă: Dată și Oră */}
          <View style={styles.leftColumn}>
            <View style={styles.iconRow}>
              <Ionicons name="calendar-outline" size={16} color="#555" />
              <Text style={styles.details}>{item.date}</Text>
            </View>
            <View style={styles.iconRow}>
              <Ionicons name="time-outline" size={16} color="#555" />
              <Text style={styles.details}>{item.time}</Text>
            </View>
          </View>

          {/* Coloana Dreaptă: Loc Parcare și Nr. Înmatriculare */}
          <View style={styles.rightColumn}>
            <View style={styles.spotBadge}>
              <Text style={styles.spotLabel}>LOC</Text>
              <Text style={styles.spotValue}>{item.spotNumber}</Text>
            </View>
            <View style={styles.plateBadge}>
              <Text style={styles.plateText}>{item.licensePlate}</Text>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{item.price > 0 ? `${item.price} RON` : 'Gratuit'}</Text>
          {item.status === 'activ' && (
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Anulează</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rezervările Mele</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, activeTab === 'active' && styles.activeFilterButton]} 
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.filterText, activeTab === 'active' && styles.activeFilterText]}>
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterButton, activeTab === 'istoric' && styles.activeFilterButton]} 
          onPress={() => setActiveTab('istoric')}
        >
          <Text style={[styles.filterText, activeTab === 'istoric' && styles.activeFilterText]}>
            Istoric
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2980B9']} tintColor="#2980B9" />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {activeTab === 'active' ? 'Nu ai nicio rezervare activă.' : 'Nu există rezervări în istoric.'}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

// 3. Stilurile complete
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterButton: {
    borderBottomColor: '#2980B9',
  },
  filterText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#2980B9',
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  address: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  details: {
    fontSize: 14,
    color: '#555',
    marginLeft: 6,
  },
  spotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 5,
  },
  spotLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2980B9',
    marginRight: 4,
  },
  spotValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  plateBadge: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#CCC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  plateText: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#333',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2980B9',
  },
  cancelButton: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  cancelButtonText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});