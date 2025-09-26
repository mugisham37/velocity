import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
    Card,
    Chip,
    IconButton,
    ProgressBar,
    Text,
    useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';

import { syncService } from '@services/sync';
import { useAuthStore } from '@store/auth';
import { RootState } from '@store/index';
import { formatCurrency, formatRelativeTime } from '@utils/helpers';

interface DashboardStats {
  totalSales: number;
  pendingOrders: number;
  lowStockItems: number;
  overdueInvoices: number;
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const syncState = useSelector((state: RootState) => state.sync);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    overdueInvoices: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // This would typically fetch from your API or local database
      // For now, using mock data
      setStats({
        totalSales: 125430.50,
        pendingOrders: 23,
        lowStockItems: 8,
        overdueInvoices: 5,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncService.syncData();
      await loadDashboardData();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    ihour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={[styles.greeting, { color: theme.colors.onSurface }]}>
            {getGreeting()}, {user?.firstName}!
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Here's what's happening with your business
          </Text>
        </View>
        <IconButton
          icon="bell"
          size={24}
          onPress={() => {/* Navigate to notifications */}}
        />
      </View>

      {/* Sync Status */}
      {syncState.isSyncing && (
        <Card style={[styles.syncCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content style={styles.syncContent}>
            <Icon name="sync" size={20} color={theme.colors.primary} />
            <Text style={[styles.syncText, { color: theme.colors.primary }]}>
              Syncing data... {Math.round(syncState.syncProgress)}%
            </Text>
            <ProgressBar
              progress={syncState.syncProgress / 100}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>
      )}

      {/* Connection Status */}
      <View style={styles.connectionStatus}>
        <Chip
          icon={syncState.isOnline ? 'wifi' : 'wifi-off'}
          style={[
            styles.connectionChip,
            { backgroundColor: syncState.isOnline ? theme.colors.tertiaryContainer : theme.colors.errorContainer }
          ]}
          textStyle={{ color: syncState.isOnline ? theme.colors.onTertiaryContainer : theme.colors.onErrorContainer }}
        >
          {syncState.isOnline ? 'Online' : 'Offline'}
        </Chip>
        {syncState.lastSyncAt && (
          <Text style={[styles.lastSync, { color: theme.colors.onSurfaceVariant }]}>
            Last sync: {formatRelativeTime(syncState.lastSyncAt)}
          </Text>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, styles.statCardLeft]}>
          <Card.Content style={styles.statContent}>
            <Icon name="currency-usd" size={32} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={[styles.statValue, { color: theme.colors.onSurface }]}>
              {formatCurrency(stats.totalSales)}
            </Text>
            <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Total Sales
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, styles.statCardRight]}>
          <Card.Content style={styles.statContent}>
            <Icon name="cart-outline" size={32} color={theme.colors.secondary} />
            <Text variant="headlineSmall" style={[styles.statValue, { color: theme.colors.onSurface }]}>
              {stats.pendingOrders}
            </Text>
            <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Pending Orders
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, styles.statCardLeft]}>
          <Card.Content style={styles.statContent}>
            <Icon name="package-variant" size={32} color={theme.colors.tertiary} />
            <Text variant="headlineSmall" style={[styles.statValue, { color: theme.colors.onSurface }]}>
              {stats.lowStockItems}
            </Text>
            <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Low Stock Items
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.statCard, styles.statCardRight]}>
          <Card.Content style={styles.statContent}>
            <Icon name="alert-circle" size={32} color={theme.colors.error} />
            <Text variant="headlineSmall" style={[styles.statValue, { color: theme.colors.onSurface }]}>
              {stats.overdueInvoices}
            </Text>
            <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Overdue Invoices
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Card.Title title="Quick Actions" />
        <Card.Content>
          <View style={styles.quickActions}>
            <View style={styles.quickAction}>
              <IconButton
                icon="plus-circle"
                size={40}
                iconColor={theme.colors.primary}
                onPress={() => {/* Navigate to create sale */}}
              />
              <Text variant="bodySmall" style={[styles.quickActionLabel, { color: theme.colors.onSurfaceVariant }]}>
                New Sale
              </Text>
            </View>

            <View style={styles.quickAction}>
              <IconButton
                icon="barcode-scan"
                size={40}
                iconColor={theme.colors.secondary}
                onPress={() => {/* Navigate to barcode scanner */}}
              />
              <Text variant="bodySmall" style={[styles.quickActionLabel, { color: theme.colors.onSurfaceVariant }]}>
                Scan Item
              </Text>
            </View>

            <View style={styles.quickAction}>
              <IconButton
                icon="account-plus"
                size={40}
                iconColor={theme.colors.tertiary}
                onPress={() => {/* Navigate to add customer */}}
              />
              <Text variant="bodySmall" style={[styles.quickActionLabel, { color: theme.colors.onSurfaceVariant }]}>
                Add Customer
              </Text>
            </View>

            <View style={styles.quickAction}>
              <IconButton
                icon="file-document"
                size={40}
                iconColor={theme.colors.outline}
                onPress={() => {/* Navigate to reports */}}
              />
              <Text variant="bodySmall" style={[styles.quickActionLabel, { color: theme.colors.onSurfaceVariant }]}>
                Reports
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Activity */}
      <Card style={styles.recentActivityCard}>
        <Card.Title title="Recent Activity" />
        <Card.Content>
          <Text variant="bodyMedium" style={[styles.emptyState, { color: theme.colors.onSurfaceVariant }]}>
            No recent activity to show
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  greeting: {
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 4,
  },
  syncCard: {
    margin: 16,
    marginTop: 0,
  },
  syncContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncText: {
    flex: 1,
    fontWeight: '500',
  },
  progressBar: {
    width: 60,
    height: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  connectionChip: {
    height: 28,
  },
  lastSync: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statCard: {
    width: '50%',
    marginBottom: 8,
  },
  statCardLeft: {
    marginRight: 4,
    marginLeft: 8,
  },
  statCardRight: {
    marginLeft: 4,
    marginRight: 8,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  quickActionsCard: {
    margin: 16,
    marginTop: 0,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  recentActivityCard: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
  },
  emptyState: {
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
