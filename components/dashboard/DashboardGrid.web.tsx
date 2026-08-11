import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  AllCommunityModule,
  ModuleRegistry,
  themeAlpine,
  type ColDef,
  type GetRowIdFunc,
  type ICellRendererParams,
  type RowSelectedEvent,
  type CellValueChangedEvent,
  type GridReadyEvent,
  type GridApi,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import * as XLSX from 'xlsx';
import { RefreshCw, Download, Trash2, LayoutGrid } from 'lucide-react-native';
import { databaseService } from '../../lib/services/pocketbase.service';
import { WarehouseOrder } from '../../lib/types/order';
import { useLanguage } from '../../lib/i18n/LanguageContext';

ModuleRegistry.registerModules([AllCommunityModule]);

const theme = themeAlpine;

interface DashboardGridProps {
  onError?: (message: string) => void;
}

function PicturesCellRenderer(params: ICellRendererParams<WarehouseOrder>) {
  const count = params.value?.length || 0;
  if (count === 0) return <span style={{ color: '#9ca3af' }}>—</span>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <img
        src={params.value![0]}
        alt=""
        style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }}
      />
      <Text style={{ fontSize: 12, color: '#6b7280' }}>
        {count > 1 ? `+${count - 1}` : ''}
      </Text>
    </View>
  );
}

export default function DashboardGrid({ onError }: DashboardGridProps) {
  const { t } = useLanguage();
  const gridApiRef = useRef<GridApi | null>(null);
  const [orders, setOrders] = useState<WarehouseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await databaseService.listOrders(1, 500);
      setOrders(result.items);
    } catch (error) {
      console.error('Failed to load orders:', error);
      onError?.(t.dashboard.errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onError, t]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const columnDefs = useMemo<ColDef<WarehouseOrder>[]>(
    () => [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 42,
        pinned: 'left',
        resizable: false,
        sortable: false,
        filter: false,
      },
      {
        field: 'id',
        headerName: 'ID',
        width: 90,
        editable: false,
        sortable: true,
        filter: true,
      },
      {
        field: 'client_article',
        headerName: t.form.clientArticle,
        flex: 1,
        minWidth: 140,
        editable: true,
        sortable: true,
        filter: true,
      },
      {
        field: 'product_name',
        headerName: t.form.productName,
        flex: 2,
        minWidth: 180,
        editable: true,
        sortable: true,
        filter: true,
      },
      {
        field: 'weight',
        headerName: t.form.weight,
        width: 120,
        editable: true,
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueParser: (params) => {
          const parsed = parseFloat(params.newValue);
          return isNaN(parsed) ? params.oldValue : parsed;
        },
      },
      {
        field: 'cubic_meters',
        headerName: t.form.cubicMeters,
        width: 140,
        editable: true,
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueParser: (params) => {
          const parsed = parseFloat(params.newValue);
          return isNaN(parsed) ? params.oldValue : parsed;
        },
        valueFormatter: (params) =>
          typeof params.value === 'number' ? params.value.toFixed(4) : params.value,
      },
      {
        field: 'quantity',
        headerName: t.form.quantity,
        width: 120,
        editable: true,
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueParser: (params) => {
          const parsed = parseInt(params.newValue, 10);
          return isNaN(parsed) ? params.oldValue : parsed;
        },
      },
      {
        field: 'client_number',
        headerName: t.form.clientNumber,
        flex: 1,
        minWidth: 140,
        editable: true,
        sortable: true,
        filter: true,
      },
      {
        field: 'date',
        headerName: t.form.date,
        width: 160,
        editable: true,
        sortable: true,
        filter: true,
        cellEditor: 'agDateCellEditor',
        cellEditorParams: {
          max: '2099-12-31',
        },
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleString() : '',
        valueParser: (params) => {
          if (!params.newValue) return params.oldValue;
          const date = new Date(params.newValue);
          return isNaN(date.getTime()) ? params.oldValue : date.toISOString();
        },
      },
      {
        field: 'created_at',
        headerName: 'Created',
        width: 160,
        editable: false,
        sortable: true,
        filter: true,
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleString() : '',
      },
      {
        field: 'pictures',
        headerName: t.form.photos,
        width: 90,
        editable: false,
        sortable: false,
        filter: false,
        cellRenderer: PicturesCellRenderer,
      },
    ],
    [t]
  );

  const defaultColDef = useMemo<ColDef<WarehouseOrder>>(
    () => ({
      resizable: true,
      suppressHeaderMenuButton: false,
    }),
    []
  );

  const getRowId = useMemo<GetRowIdFunc<WarehouseOrder>>(
    () => (params) => params.data.id || '',
    []
  );

  const handleGridReady = useCallback((event: GridReadyEvent<WarehouseOrder>) => {
    gridApiRef.current = event.api;
  }, []);

  const handleCellValueChanged = useCallback(
    async (event: CellValueChangedEvent<WarehouseOrder>) => {
      const { data, colDef, newValue } = event;
      if (!data.id || !colDef.field) return;

      try {
        await databaseService.updateOrder(data.id, {
          [colDef.field]: newValue,
        });
      } catch (error) {
        console.error('Failed to save cell change:', error);
        onError?.(t.dashboard.saveError);
        // Revert the local change by refreshing
        loadOrders();
      }
    },
    [loadOrders, onError, t]
  );

  const handleRowSelected = useCallback((event: RowSelectedEvent<WarehouseOrder>) => {
    const id = event.data?.id;
    if (!id) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (event.node.isSelected()) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleExportExcel = useCallback(() => {
    const exportRows = orders.map((order) => ({
      ID: order.id,
      [t.form.clientArticle]: order.client_article,
      [t.form.productName]: order.product_name,
      [t.form.weight]: order.weight,
      [t.form.cubicMeters]: order.cubic_meters,
      [t.form.quantity]: order.quantity,
      [t.form.clientNumber]: order.client_number,
      [t.form.date]: order.date ? new Date(order.date).toLocaleString() : '',
      Created: order.created_at ? new Date(order.created_at).toLocaleString() : '',
      [t.form.photos]: order.pictures?.length || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

    const fileName = `orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }, [orders, t]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      t.dashboard.deleteConfirmTitle,
      t.dashboard.deleteConfirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                Array.from(selectedIds).map((id) => databaseService.deleteOrder(id))
              );
              setSelectedIds(new Set());
              loadOrders();
            } catch (error) {
              console.error('Failed to delete orders:', error);
              onError?.(t.dashboard.deleteError);
            }
          },
        },
      ]
    );
  }, [loadOrders, onError, selectedIds, t]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <LayoutGrid size={28} color="#007AFF" />
          <Text style={styles.title}>{t.dashboard.title}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={loadOrders} disabled={loading}>
            <RefreshCw size={18} color="#007AFF" style={loading ? styles.spinning : undefined} />
            <Text style={styles.actionText}>{t.dashboard.refresh}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportExcel}>
            <Download size={18} color="#007AFF" />
            <Text style={styles.actionText}>{t.dashboard.exportExcel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, selectedIds.size === 0 && styles.actionButtonDisabled]}
            onPress={handleDeleteSelected}
            disabled={selectedIds.size === 0}>
            <Trash2 size={18} color={selectedIds.size === 0 ? '#9ca3af' : '#dc2626'} />
            <Text
              style={[
                styles.actionText,
                selectedIds.size === 0 && styles.actionTextDisabled,
              ]}>
              {t.dashboard.deleteSelected}
              {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.gridWrapper}>
        {loading && orders.length === 0 ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>{t.dashboard.loading}</Text>
          </View>
        ) : (
          <div className="ag-theme-alpine" style={{ width: '100%', height: '100%' }}>
            <AgGridReact<WarehouseOrder>
              theme={theme}
              rowData={orders}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              getRowId={getRowId}
              rowSelection={{ mode: 'multiRow' }}
              pagination
              paginationPageSize={50}
              paginationPageSizeSelector={[25, 50, 100, 200]}
              undoRedoCellEditing
              undoRedoCellEditingLimit={10}
              stopEditingWhenCellsLoseFocus
              onGridReady={handleGridReady}
              onCellValueChanged={handleCellValueChanged}
              onRowSelected={handleRowSelected}
            />
          </div>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  actionTextDisabled: {
    color: '#9ca3af',
  },
  gridWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  spinning: {
    transform: [{ rotate: '180deg' }],
  },
});
