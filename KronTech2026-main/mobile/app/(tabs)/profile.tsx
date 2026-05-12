import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  // Date simulate pentru utilizator
  const user = {
    name: 'Teodor',
    email: 'teodor@student.unitbv.ro',
    phone: '+40 722 123 456',
    car: 'Kawasaki ER-6f (BV 22 ABC)'
  };

  const MenuItem = ({ icon, title, subtitle, onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon} size={22} color="#2980B9" />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header Profil */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#2980B9" />
            <TouchableOpacity style={styles.editBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* Secțiune Detalii Cont */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contul Meu</Text>
          <MenuItem 
            icon="car-outline" 
            title="Vehiculele mele" 
            subtitle={user.car} 
          />
          <MenuItem 
            icon="card-outline" 
            title="Metode de plată" 
            subtitle="**** **** **** 4421" 
          />
          <MenuItem 
            icon="notifications-outline" 
            title="Notificări" 
          />
        </View>

        {/* Secțiune Suport & Setări */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suport & Legal</Text>
          <MenuItem icon="help-circle-outline" title="Centru de ajutor" />
          <MenuItem icon="shield-checkmark-outline" title="Termeni și Condiții" />
        </View>

        {/* Buton Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#E74C3C" style={{ marginRight: 10 }} />
          <Text style={styles.logoutText}>Deconectare</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Versiunea 1.0.2 - KronTech 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#2980B9',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  userEmail: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#EEE',
    borderBottomColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#95A5A6',
    marginVertical: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EBF5FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 10,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#BDC3C7',
    fontSize: 12,
    marginBottom: 30,
  }
});