import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  DashboardState,
  DashboardActions,
  DashboardConfig,
  WidgetConfig,
  WidgetPosition,
  WidgetSize,
  WidgetData,
} from '@/types/dashboard';

interface DashboardStore extends DashboardState, DashboardActions {}

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      currentDashboard: null,
      availableDashboards: [],
      widgetData: {},
      isLoading: false,
      isEditing: false,
      error: undefined,

      // Actions
      loadDashboard: async (name: string) => {
        set({ isLoading: true, error: undefined });
        try {
          // TODO: Replace with actual API call
          const mockDashboard: DashboardConfig = {
            name,
            title: `Dashboard: ${name}`,
            type: 'workspace',
            widgets: [],
            layout: {
              columns: 12,
              rows: 8,
              gridGap: 16,
            },
            permissions: {
              read: ['All'],
              write: ['System Manager'],
              share: ['System Manager'],
            },
          };

          set({
            currentDashboard: mockDashboard,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load dashboard',
            isLoading: false,
          });
        }
      },

      saveDashboard: async (config: DashboardConfig) => {
        set({ isLoading: true, error: undefined });
        try {
          // TODO: Replace with actual API call
          console.log('Saving dashboard:', config);
          
          set((state) => ({
            currentDashboard: config,
            availableDashboards: state.availableDashboards.map((d) =>
              d.name === config.name ? config : d
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to save dashboard',
            isLoading: false,
          });
        }
      },

      addWidget: (widget: WidgetConfig) => {
        set((state) => {
          if (!state.currentDashboard) return state;

          const updatedDashboard = {
            ...state.currentDashboard,
            widgets: [...state.currentDashboard.widgets, widget],
          };

          return {
            currentDashboard: updatedDashboard,
          };
        });
      },

      updateWidget: (id: string, updates: Partial<WidgetConfig>) => {
        set((state) => {
          if (!state.currentDashboard) return state;

          const updatedDashboard = {
            ...state.currentDashboard,
            widgets: state.currentDashboard.widgets.map((widget) =>
              widget.id === id ? { ...widget, ...updates } : widget
            ),
          };

          return {
            currentDashboard: updatedDashboard,
          };
        });
      },

      removeWidget: (id: string) => {
        set((state) => {
          if (!state.currentDashboard) return state;

          const updatedDashboard = {
            ...state.currentDashboard,
            widgets: state.currentDashboard.widgets.filter((widget) => widget.id !== id),
          };

          // Also remove widget data
          const { [id]: removed, ...remainingWidgetData } = state.widgetData;

          return {
            currentDashboard: updatedDashboard,
            widgetData: remainingWidgetData,
          };
        });
      },

      moveWidget: (id: string, position: WidgetPosition) => {
        get().updateWidget(id, { position });
      },

      resizeWidget: (id: string, size: WidgetSize) => {
        get().updateWidget(id, { size });
      },

      refreshWidget: async (id: string) => {
        const { currentDashboard, widgetData } = get();
        if (!currentDashboard) return;

        const widget = currentDashboard.widgets.find((w) => w.id === id);
        if (!widget) return;

        // Set loading state for this widget
        set((state) => ({
          widgetData: {
            ...state.widgetData,
            [id]: {
              ...state.widgetData[id],
              isLoading: true,
              error: undefined,
            },
          },
        }));

        try {
          // TODO: Replace with actual data fetching based on widget type and config
          const mockData = await fetchWidgetData(widget);
          
          set((state) => ({
            widgetData: {
              ...state.widgetData,
              [id]: {
                id,
                data: mockData,
                lastUpdated: new Date().toISOString(),
                isLoading: false,
              },
            },
          }));
        } catch (error) {
          set((state) => ({
            widgetData: {
              ...state.widgetData,
              [id]: {
                ...state.widgetData[id],
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch widget data',
              },
            },
          }));
        }
      },

      refreshAllWidgets: async () => {
        const { currentDashboard } = get();
        if (!currentDashboard) return;

        const refreshPromises = currentDashboard.widgets.map((widget) =>
          get().refreshWidget(widget.id)
        );

        await Promise.all(refreshPromises);
      },

      toggleEditMode: () => {
        set((state) => ({
          isEditing: !state.isEditing,
        }));
      },

      duplicateDashboard: async (name: string, newName: string) => {
        const { availableDashboards } = get();
        const dashboardToDuplicate = availableDashboards.find((d) => d.name === name);
        
        if (!dashboardToDuplicate) {
          throw new Error('Dashboard not found');
        }

        const duplicatedDashboard: DashboardConfig = {
          ...dashboardToDuplicate,
          name: newName,
          title: `${dashboardToDuplicate.title} (Copy)`,
          widgets: dashboardToDuplicate.widgets.map((widget) => ({
            ...widget,
            id: `${widget.id}_copy_${Date.now()}`,
          })),
        };

        await get().saveDashboard(duplicatedDashboard);
      },

      deleteDashboard: async (name: string) => {
        set({ isLoading: true, error: undefined });
        try {
          // TODO: Replace with actual API call
          console.log('Deleting dashboard:', name);
          
          set((state) => ({
            availableDashboards: state.availableDashboards.filter((d) => d.name !== name),
            currentDashboard: state.currentDashboard?.name === name ? null : state.currentDashboard,
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete dashboard',
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'dashboard-store',
    }
  )
);

// Mock function to simulate data fetching
async function fetchWidgetData(widget: WidgetConfig): Promise<unknown> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  switch (widget.type) {
    case 'chart':
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Sales',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      };
    case 'number':
      return {
        value: Math.floor(Math.random() * 10000),
        trend: {
          value: Math.floor(Math.random() * 100),
          percentage: Math.floor(Math.random() * 20) - 10,
          direction: Math.random() > 0.5 ? 'up' : 'down' as const,
        },
      };
    default:
      return null;
  }
}