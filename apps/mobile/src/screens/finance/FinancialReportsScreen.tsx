import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  IconButton,
  Menu,
  Text,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { formatDate } from '@utils/helpers';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: stri;
  tGenerated?: Date;
}

export default function FinancialReportsScreen() {
  const theme = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [periodMenuVisible, setPeriodMenuVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'balance-sheet',
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity at a point in time',
      category: 'Financial Position',
      icon: 'scale-balance',
      lastGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: 'profit-loss',
      name: 'Profit & Loss Statement',
      description: 'Revenue, expenses, and net income for a period',
      category: 'Performance',
      icon: 'trending-up',
      lastGenerated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow Statement',
      description: 'Cash receipts and payments by activity type',
      category: 'Cash Management',
      icon: 'cash-flow',
      lastGenerated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      id: 'trial-balance',
      name: 'Trial Balance',
      description: 'All account balances to verify books balance',
      category: 'Accounting',
      icon: 'format-list-checks',
      lastGenerated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: 'financial-ratios',
      name: 'Financial Ratios',
      description: 'Key performance indicators and benchmarks',
      category: 'Analysis',
      icon: 'calculator',
      lastGenerated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    },
    {
      id: 'aging-receivables',
      name: 'Aging Receivables',
      description: 'Customer balances by aging periods',
      category: 'Receivables',
      icon: 'clock-outline',
    },
    {
      id: 'expense-analysis',
      name: 'Expense Analysis',
      description: 'Detailed expense breakdown and trends',
      category: 'Analysis',
      icon: 'chart-pie',
    },
    {
      id: 'budget-variance',
      name: 'Budget Variance',
      description: 'Actual vs budgeted amounts with variances',
      category: 'Budgeting',
      icon: 'target',
    },
  ];

  const periodOptions = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'current_quarter', label: 'Current Quarter' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'current_year', label: 'Current Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const categories = [
    'all',
    'Financial Position',
    'Performance',
    'Cash Management',
    'Accounting',
    'Analysis',
    'Receivables',
    'Budgeting',
  ];

  const filteredReports = reportTemplates.filter(
    report => categoryFilter === 'all' || report.category === categoryFilter
  );

  const handleGenerateReport = (reportId: string) => {
    // TODO: Navigate to report generation screen or generate report
    console.log('Generating report:', reportId, 'for period:', selectedPeriod);
  };

  const handleViewReport = (reportId: string) => {
    // TODO: Navigate to report viewer
    console.log('Viewing report:', reportId);
  };

  const getPeriodLabel = () => {
    return (
      periodOptions.find(option => option.value === selectedPeriod)?.label ||
      'Select Period'
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text
          variant='headlineSmall'
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          Financial Reports
        </Text>
        <IconButton
          icon='help-circle-outline'
          size={24}
          onPress={() => {
            /* Show help */
          }}
        />
      </View>

      {/* Period Selector */}
      <Card style={styles.periodCard}>
        <Card.Content>
          <View style={styles.periodSelector}>
            <Text
              variant='bodyMedium'
              style={[styles.periodLabel, { color: theme.colors.onSurface }]}
            >
              Report Period:
            </Text>
            <Menu
              visible={periodMenuVisible}
              onDismiss={() => setPeriodMenuVisible(false)}
              anchor={
                <Button
                  mode='outlined'
                  onPress={() => setPeriodMenuVisible(true)}
                  icon='calendar'
                  style={styles.periodButton}
                >
                  {getPeriodLabel()}
                </Button>
              }
            >
              {periodOptions.map(option => (
                <Menu.Item
                  key={option.value}
                  onPress={() => {
                    setSelectedPeriod(option.value);
                    setPeriodMenuVisible(false);
                  }}
                  title={option.label}
                />
              ))}
            </Menu>
          </View>
        </Card.Content>
      </Card>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {categories.map(category => (
          <Chip
            key={category}
            selected={categoryFilter === category}
            onPress={() => setCategoryFilter(category)}
            style={[
              styles.categoryChip,
              categoryFilter === category && {
                backgroundColor: theme.colors.primaryContainer,
              },
            ]}
            textStyle={
              categoryFilter === category
                ? { color: theme.colors.primary }
                : undefined
            }
          >
            {category === 'all' ? 'All Reports' : category}
          </Chip>
        ))}
      </ScrollView>

      {/* Reports List */}
      <ScrollView style={styles.reportsList}>
        {filteredReports.map((report, index) => (
          <Card key={report.id} style={styles.reportCard}>
            <Card.Content>
              <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                  <Icon
                    name={report.icon}
                    size={24}
                    color={theme.colors.primary}
                    style={styles.reportIcon}
                  />
                  <View style={styles.reportDetails}>
                    <Text
                      variant='titleMedium'
                      style={[
                        styles.reportName,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {report.name}
                    </Text>
                    <Text
                      variant='bodySmall'
                      style={[
                        styles.reportDescription,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {report.description}
                    </Text>
                    <View style={styles.reportMeta}>
                      <Chip
                        icon='folder'
                        style={styles.categoryTag}
                        textStyle={{ fontSize: 11 }}
                      >
                        {report.category}
                      </Chip>
                      {report.lastGenerated && (
                        <Text
                          variant='bodySmall'
                          style={[
                            styles.lastGenerated,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          Last: {formatDate(report.lastGenerated, 'short')}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.reportActions}>
                  <IconButton
                    icon='play'
                    size={20}
                    iconColor={theme.colors.primary}
                    onPress={() => handleGenerateReport(report.id)}
                  />
                  {report.lastGenerated && (
                    <IconButton
                      icon='eye'
                      size={20}
                      iconColor={theme.colors.secondary}
                      onPress={() => handleViewReport(report.id)}
                    />
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}

        {filteredReports.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon
                name='file-document-outline'
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                variant='titleMedium'
                style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
              >
                No Reports Found
              </Text>
              <Text
                variant='bodyMedium'
                style={[
                  styles.emptyMessage,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Try selecting a different category filter
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Card.Content>
          <Text
            variant='titleMedium'
            style={[
              styles.quickActionsTitle,
              { color: theme.colors.onSurface },
            ]}
          >
            Quick Actions
          </Text>
          <View style={styles.quickActions}>
            <Button
              mode='outlined'
              icon='file-plus'
              onPress={() => {
                /* Navigate to custom report builder */
              }}
              style={styles.quickActionButton}
            >
              Custom Report
            </Button>
            <Button
              mode='outlined'
              icon='download'
              onPress={() => {
                /* Export reports */
              }}
              style={styles.quickActionButton}
            >
              Export All
            </Button>
            <Button
              mode='outlined'
              icon='calendar-clock'
              onPress={() => {
                /* Schedule reports */
              }}
              style={styles.quickActionButton}
            >
              Schedule
            </Button>
          </View>
        </Card.Content>
      </Card>
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
  periodCard: {
    margin: 16,
    marginTop: 0,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodLabel: {
    fontWeight: '500',
  },
  periodButton: {
    minWidth: 150,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  reportsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  reportCard: {
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reportInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reportIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  reportDetails: {
    flex: 1,
  },
  reportName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  reportDescription: {
    marginBottom: 8,
    lineHeight: 18,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryTag: {
    height: 24,
  },
  lastGenerated: {
    fontSize: 11,
  },
  reportActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyMessage: {
    textAlign: 'center',
  },
  quickActionsCard: {
    margin: 16,
    marginTop: 0,
  },
  quickActionsTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
  },
});
