import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  Card,
  Chip,
  FAB,
  IconButton,
  List,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useSyncStore } from '@store/index';
import { formatCurrency, formatPercentage } from '@utils/helpers';

interface FinancialMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  cashPosition: number;
  profitMargin: number;
  currentRatio: number;
  quickRatio: number;
  debtToEquity: number;
}

interface FinancialAlert {
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export default function FinanceScreen() {
  const theme = useTheme();
  const syncState = useSyncStore();
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    cashPosition: 0,
    profitMargin: 0,
    currentRatio: 0,
    quickRatio: 0,
    debtToEquity: 0,
  });
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      // Mock financial data - in production, this would fetch from GraphQL API
      setMetrics({
        totalRevenue: 485230.75,
        totalExpenses: 342150.25,
        netIncome: 143080.5,
        totalAssets: 1250000.0,
        totalLiabilities: 450000.0,
        cashPosition: 125000.0,
        profitMargin: 29.5,
        currentRatio: 2.1,
        quickRatio: 1.8,
        debtToEquity: 0.56,
      });

      setAlerts([
        {
          type: 'info',
          title: 'Strong Performance',
          message: 'Profit margin of 29.5% exceeds industry benchmark',
          priority: 'medium',
        },
        {
          type: 'warning',
          title: 'Cash Flow Review',
          message: 'Consider optimizing cash flow management',
          priority: 'low',
        },
      ]);
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadFinancialData();
    } catch (error) {
      console.error('Error refreshing financial data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      case 'info':
        return 'information';
      default:
        return 'information';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.tertiary;
      case 'info':
        return theme.colors.primary;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            variant='headlineSmall'
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Financial Overview
          </Text>
          <IconButton
            icon='chart-line'
            size={24}
            onPress={() => {
              /* Navigate to detailed analytics */
            }}
          />
        </View>

        {/* Sync Status */}
        {syncState.isSyncing && (
          <Card
            style={[
              styles.syncCard,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Card.Content style={styles.syncContent}>
              <Icon name='sync' size={20} color={theme.colors.primary} />
              <Text style={[styles.syncText, { color: theme.colors.primary }]}>
                Syncing financial data...
              </Text>
              <ProgressBar
                progress={syncState.syncProgress / 100}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </Card.Content>
          </Card>
        )}

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <Card style={[styles.metricCard, styles.metricCardLeft]}>
            <Card.Content style={styles.metricContent}>
              <Icon name='trending-up' size={28} color={theme.colors.primary} />
              <Text
                variant='headlineSmall'
                style={[styles.metricValue, { color: theme.colors.onSurface }]}
              >
                {formatCurrency(metrics.netIncome)}
              </Text>
              <Text
                variant='bodySmall'
                style={[
                  styles.metricLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Net Income
              </Text>
              <Chip
                icon='arrow-up'
                style={[
                  styles.metricChip,
                  { backgroundColor: theme.colors.tertiaryContainer },
                ]}
                textStyle={{
                  color: theme.colors.onTertiaryContainer,
                  fontSize: 12,
                }}
              >
                {formatPercentage(metrics.profitMargin)}
              </Chip>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, styles.metricCardRight]}>
            <Card.Content style={styles.metricContent}>
              <Icon
                name='cash-multiple'
                size={28}
                color={theme.colors.secondary}
              />
              <Text
                variant='headlineSmall'
                style={[styles.metricValue, { color: theme.colors.onSurface }]}
              >
                {formatCurrency(metrics.cashPosition)}
              </Text>
              <Text
                variant='bodySmall'
                style={[
                  styles.metricLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Cash Position
              </Text>
              <Chip
                icon='water'
                style={[
                  styles.metricChip,
                  { backgroundColor: theme.colors.secondaryContainer },
                ]}
                textStyle={{
                  color: theme.colors.onSecondaryContainer,
                  fontSize: 12,
                }}
              >
                Liquid
              </Chip>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, styles.metricCardLeft]}>
            <Card.Content style={styles.metricContent}>
              <Icon
                name='scale-balance'
                size={28}
                color={theme.colors.tertiary}
              />
              <Text
                variant='headlineSmall'
                style={[styles.metricValue, { color: theme.colors.onSurface }]}
              >
                {metrics.currentRatio.toFixed(1)}
              </Text>
              <Text
                variant='bodySmall'
                style={[
                  styles.metricLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Current Ratio
              </Text>
              <Chip
                icon='check'
                style={[
                  styles.metricChip,
                  { backgroundColor: theme.colors.tertiaryContainer },
                ]}
                textStyle={{
                  color: theme.colors.onTertiaryContainer,
                  fontSize: 12,
                }}
              >
                Healthy
              </Chip>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, styles.metricCardRight]}>
            <Card.Content style={styles.metricContent}>
              <Icon name='chart-pie' size={28} color={theme.colors.outline} />
              <Text
                variant='headlineSmall'
                style={[styles.metricValue, { color: theme.colors.onSurface }]}
              >
                {metrics.debtToEquity.toFixed(2)}
              </Text>
              <Text
                variant='bodySmall'
                style={[
                  styles.metricLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Debt-to-Equity
              </Text>
              <Chip
                icon='shield-check'
                style={[
                  styles.metricChip,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
                textStyle={{
                  color: theme.colors.onSurfaceVariant,
                  fontSize: 12,
                }}
              >
                Conservative
              </Chip>
            </Card.Content>
          </Card>
        </View>

        {/* Financial Reports */}
        <Card style={styles.reportsCard}>
          <Card.Title
            title='Financial Reports'
            right={(props: any) => (
              <IconButton
                {...props}
                icon='chevron-right'
                onPress={() => {
                  /* Navigate to reports */
                }}
              />
            )}
          />
          <Card.Content>
            <List.Item
              title='Balance Sheet'
              description='Assets, liabilities, and equity'
              left={(props: any) => (
                <List.Icon {...props} icon='scale-balance' />
              )}
              right={(props: any) => (
                <List.Icon {...props} icon='chevron-right' />
              )}
              onPress={() => {
                /* Navigate to balance sheet */
              }}
            />
            <List.Item
              title='Profit & Loss'
              description='Revenue and expenses'
              left={(props: any) => <List.Icon {...props} icon='trending-up' />}
              right={(props: any) => (
                <List.Icon {...props} icon='chevron-right' />
              )}
              onPress={() => {
                /* Navigate to P&L */
              }}
            />
            <List.Item
              title='Cash Flow'
              description='Cash receipts and payments'
              left={(props: any) => <List.Icon {...props} icon='cash-flow' />}
              right={(props: any) => (
                <List.Icon {...props} icon='chevron-right' />
              )}
              onPress={() => {
                /* Navigate to cash flow */
              }}
            />
            <List.Item
              title='Financial Ratios'
              description='Key performance indicators'
              left={(props: any) => <List.Icon {...props} icon='calculator' />}
              right={(props: any) => (
                <List.Icon {...props} icon='chevron-right' />
              )}
              onPress={() => {
                /* Navigate to ratios */
              }}
            />
          </Card.Content>
        </Card>

        {/* Alerts & Insights */}
        {alerts.length > 0 && (
          <Card style={styles.alertsCard}>
            <Card.Title title='Alerts & Insights' />
            <Card.Content>
              {alerts.map((alert, index) => (
                <View key={index} style={styles.alertItem}>
                  <Icon
                    name={getAlertIcon(alert.type)}
                    size={20}
                    color={getAlertColor(alert.type)}
                  />
                  <View style={styles.alertContent}>
                    <Text
                      variant='bodyMedium'
                      style={[
                        styles.alertTitle,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {alert.title}
                    </Text>
                    <Text
                      variant='bodySmall'
                      style={[
                        styles.alertMessage,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {alert.message}
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Card.Title title='Quick Actions' />
          <Card.Content>
            <View style={styles.quickActions}>
              <View style={styles.quickAction}>
                <IconButton
                  icon='file-chart'
                  size={40}
                  iconColor={theme.colors.primary}
                  onPress={() => {
                    /* Navigate to custom reports */
                  }}
                />
                <Text
                  variant='bodySmall'
                  style={[
                    styles.quickActionLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Custom Reports
                </Text>
              </View>

              <View style={styles.quickAction}>
                <IconButton
                  icon='chart-timeline-variant'
                  size={40}
                  iconColor={theme.colors.secondary}
                  onPress={() => {
                    /* Navigate to analytics */
                  }}
                />
                <Text
                  variant='bodySmall'
                  style={[
                    styles.quickActionLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Analytics
                </Text>
              </View>

              <View style={styles.quickAction}>
                <IconButton
                  icon='export'
                  size={40}
                  iconColor={theme.colors.tertiary}
                  onPress={() => {
                    /* Export reports */
                  }}
                />
                <Text
                  variant='bodySmall'
                  style={[
                    styles.quickActionLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Export
                </Text>
              </View>

              <View style={styles.quickAction}>
                <IconButton
                  icon='cog'
                  size={40}
                  iconColor={theme.colors.outline}
                  onPress={() => {
                    /* Navigate to settings */
                  }}
                />
                <Text
                  variant='bodySmall'
                  style={[
                    styles.quickActionLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Settings
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon='plus'
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          /* Navigate to create report */
        }}
      />
    </View>
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
  title: {
    fontWeight: 'bold',
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  metricCard: {
    width: '50%',
    marginBottom: 8,
  },
  metricCardLeft: {
    marginRight: 4,
    marginLeft: 8,
  },
  metricCardRight: {
    marginLeft: 4,
    marginRight: 8,
  },
  metricContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  metricValue: {
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  metricLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  metricChip: {
    marginTop: 8,
    height: 24,
  },
  reportsCard: {
    margin: 16,
    marginTop: 0,
  },
  alertsCard: {
    margin: 16,
    marginTop: 0,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: '500',
    marginBottom: 2,
  },
  alertMessage: {
    lineHeight: 18,
  },
  quickActionsCard: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
