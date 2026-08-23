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
import { WarehouseOrder, CARGO_TYPES, CargoType } from '../../lib/types/order';
import { Freight } from '../../lib/types/freight';
import { calculateOrderPrice, formatPrice } from '../../utils/pricing';
import { useLanguage } from '../../lib/i18n/LanguageContext';

ModuleRegistry.registerModules([AllCommunityModule]);

const theme = themeAlpine;

interface DashboardGridProps {
  onError?: (message: string) => void;
  freightId?: string;
}

interface PicturesCellRendererParams extends ICellRendererParams<WarehouseOrder> {
  onImageClick?: (images: string[]) => void;
}

function PicturesCellRenderer(params: PicturesCellRendererParams) {
  const count = params.value?.length || 0;
  if (count === 0) return <span style={{ color: '#9ca3af' }}>—</span>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <button
        type="button"
        onClick={() => params.onImageClick?.(params.value || [])}
        style={{
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: params.onImageClick ? 'pointer' : 'default',
        }}>
        <img
          src={params.value![0]}
          alt=""
          style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }}
        />
      </button>
      <Text style={{ fontSize: 12, color: '#6b7280' }}>
        {count > 1 ? `+${count - 1}` : ''}
      </Text>
    </View>
  );
}

export default function DashboardGrid({ onError, freightId }: DashboardGridProps) {
  const { t } = useLanguage();
  const gridApiRef = useRef<GridApi | null>(null);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [orders, setOrders] = useState<WarehouseOrder[]>([]);
  const [freights, setFreights] = useState<Freight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveStatusMessage, setSaveStatusMessage] = useState('');
  const [freightModalVisible, setFreightModalVisible] = useState(false);
  const [freightModalMode, setFreightModalMode] = useState<'existing' | 'new'>('existing');
  const [selectedFreightId, setSelectedFreightId] = useState<string>('');
  const [newFreightLoadDate, setNewFreightLoadDate] = useState<string>('');
  const [newFreightNotes, setNewFreightNotes] = useState<string>('');
  const [exportMode, setExportMode] = useState<'all' | 'filtered' | 'selected'>('all');
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await databaseService.listOrders(1, 500);
      let items = result.items;
      if (freightId) {
        items = items.filter((order) => order.freight_id === freightId);
      } else {
        items = items.filter((order) => !order.freight_id);
      }
      setOrders(items);
    } catch (error) {
      console.error('Failed to load orders:', error);
      onError?.(t.dashboard.errorMessage);
    } finally {
      setLoading(false);
    }
  }, [freightId, onError, t]);

  const loadFreights = useCallback(async () => {
    try {
      const items = await databaseService.listFreights();
      setFreights(items);
    } catch (error) {
      console.error('Failed to load freights:', error);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }
    };
  }, []);

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
        field: 'customer_name',
        headerName: t.form.customerName,
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
        field: 'cargo_type',
        headerName: t.dashboard.cargoType,
        width: 130,
        editable: true,
        sortable: true,
        filter: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: CARGO_TYPES,
        },
        valueFormatter: (params) => {
          const value = params.value as CargoType | undefined;
          return value ? t.dashboard.cargoTypes[value] : '';
        },
      },
      {
        colId: 'price',
        headerName: t.dashboard.price,
        width: 120,
        editable: false,
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueGetter: (params) => {
          const order = params.data;
          if (!order) return 0;
          return calculateOrderPrice(order.weight, order.cubic_meters);
        },
        valueFormatter: (params) => formatPrice(params.value as number),
      },
      ...(freightId
        ? []
        : [
            {
              field: 'freight_number' as const,
              headerName: t.dashboard.freightNumber,
              width: 130,
              editable: false,
              sortable: true,
              filter: true,
            },
          ]),
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
        cellRendererParams: {
          onImageClick: setLightboxImages,
        },
      },
    ],
    [freightId, t]
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

  const setSaveFeedback = useCallback(
    (status: 'idle' | 'saving' | 'saved' | 'error', message: string) => {
      if (saveStatusTimerRef.current) {
        clearTimeout(saveStatusTimerRef.current);
      }

      setSaveStatus(status);
      setSaveStatusMessage(message);

      if (status === 'saved' || status === 'error') {
        saveStatusTimerRef.current = setTimeout(() => {
          setSaveStatus('idle');
          setSaveStatusMessage('');
        }, 3000);
      }
    },
    []
  );

  const handleCellValueChanged = useCallback(
    async (event: CellValueChangedEvent<WarehouseOrder>) => {
      const { data, colDef, newValue } = event;
      if (!data.id || !colDef.field) return;

      setSaveFeedback('saving', t.dashboard.saving);

      try {
        await databaseService.updateOrder(data.id, {
          [colDef.field]: newValue,
        });
        setSaveFeedback('saved', t.dashboard.saved);
      } catch (error) {
        console.error('Failed to save cell change:', error);
        setSaveFeedback('error', t.dashboard.saveError);
        onError?.(t.dashboard.saveError);
        // Revert the local change by refreshing
        loadOrders();
      }
    },
    [loadOrders, onError, setSaveFeedback, t]
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
    let rowsToExport: WarehouseOrder[] = [];

    if (exportMode === 'all') {
      rowsToExport = orders;
    } else if (exportMode === 'filtered') {
      gridApiRef.current?.forEachNodeAfterFilter((node) => {
        if (node.data) rowsToExport.push(node.data);
      });
    } else if (exportMode === 'selected') {
      gridApiRef.current?.forEachNode((node) => {
        if (node.isSelected() && node.data) rowsToExport.push(node.data);
      });
    }

    if (rowsToExport.length === 0) return;

    const exportRows = rowsToExport.map((order) => ({
      ID: order.id,
      [t.form.customerName]: order.customer_name,
      [t.form.productName]: order.product_name,
      [t.form.weight]: order.weight,
      [t.form.cubicMeters]: order.cubic_meters,
      [t.form.quantity]: order.quantity,
      [t.form.clientNumber]: order.client_number,
      [t.dashboard.cargoType]: order.cargo_type
        ? t.dashboard.cargoTypes[order.cargo_type]
        : '',
      [t.dashboard.price]: formatPrice(
        calculateOrderPrice(order.weight, order.cubic_meters)
      ),
      [t.dashboard.freightNumber]: order.freight_number || '',
      [t.form.date]: order.date ? new Date(order.date).toLocaleString() : '',
      Created: order.created_at ? new Date(order.created_at).toLocaleString() : '',
      [t.form.photos]: order.pictures?.length || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

    const suffix = exportMode === 'all' ? 'all' : exportMode;
    const fileName = `orders_${suffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }, [exportMode, orders, t]);

  const handleOpenAssignFreight = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await loadFreights();
    setFreightModalMode('existing');
    setSelectedFreightId(freights[0]?.id || '');
    setNewFreightLoadDate(new Date().toISOString().slice(0, 16));
    setNewFreightNotes('');
    setFreightModalVisible(true);
  }, [freights, loadFreights, selectedIds.size]);

  const handleAssignExistingFreight = useCallback(async () => {
    if (!selectedFreightId || selectedIds.size === 0) return;

    try {
      await databaseService.assignOrdersToFreight(Array.from(selectedIds), selectedFreightId);
      setSelectedIds(new Set());
      setFreightModalVisible(false);
      loadOrders();
    } catch (error) {
      console.error('Failed to assign orders:', error);
      onError?.(t.dashboard.assignFreightError || 'Failed to assign orders to freight');
    }
  }, [loadOrders, onError, selectedFreightId, selectedIds, t]);

  const handleCreateAndAssignFreight = useCallback(async () => {
    if (!newFreightLoadDate || selectedIds.size === 0) return;

    try {
      const freight = await databaseService.createFreight({
        load_date: new Date(newFreightLoadDate).toISOString(),
        notes: newFreightNotes,
        status: 'open',
      });
      await databaseService.assignOrdersToFreight(Array.from(selectedIds), freight.id!);
      setSelectedIds(new Set());
      setFreightModalVisible(false);
      loadOrders();
      loadFreights();
    } catch (error) {
      console.error('Failed to create freight:', error);
      onError?.(t.dashboard.createFreightError || 'Failed to create freight');
    }
  }, [loadOrders, loadFreights, newFreightLoadDate, newFreightNotes, onError, selectedIds, t]);

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

  const currentFreight = useMemo(
    () => freights.find((f) => f.id === freightId),
    [freights, freightId]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <LayoutGrid size={28} color="#007AFF" />
          <Text style={styles.title}>
            {freightId && currentFreight
              ? `${t.dashboard.freight}: ${currentFreight.freight_number}`
              : t.dashboard.title}
          </Text>
          {saveStatus !== 'idle' && (
            <View
              style={[
                styles.statusBadge,
                saveStatus === 'saving' && styles.statusBadgeSaving,
                saveStatus === 'saved' && styles.statusBadgeSaved,
                saveStatus === 'error' && styles.statusBadgeError,
              ]}>
              <View
                style={[
                  styles.statusDot,
                  saveStatus === 'saving' && styles.statusDotSaving,
                  saveStatus === 'saved' && styles.statusDotSaved,
                  saveStatus === 'error' && styles.statusDotError,
                ]}
              />
              <Text style={styles.statusText}>{saveStatusMessage}</Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={loadOrders} disabled={loading}>
            <RefreshCw size={18} color="#007AFF" style={loading ? styles.spinning : undefined} />
            <Text style={styles.actionText}>{t.dashboard.refresh}</Text>
          </TouchableOpacity>
          <select
            style={styles.exportModeSelect}
            value={exportMode}
            onChange={(e) => setExportMode(e.target.value as 'all' | 'filtered' | 'selected')}>
            <option value="all">{t.dashboard.exportAll}</option>
            <option value="filtered">{t.dashboard.exportFiltered}</option>
            <option value="selected">{t.dashboard.exportSelected}</option>
          </select>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportExcel}>
            <Download size={18} color="#007AFF" />
            <Text style={styles.actionText}>{t.dashboard.exportExcel}</Text>
          </TouchableOpacity>
          {!freightId && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, selectedIds.size === 0 && styles.actionButtonDisabled]}
                onPress={handleOpenAssignFreight}
                disabled={selectedIds.size === 0}>
                <LayoutGrid size={18} color={selectedIds.size === 0 ? '#9ca3af' : '#007AFF'} />
                <Text
                  style={[
                    styles.actionText,
                    selectedIds.size === 0 && styles.actionTextDisabled,
                  ]}>
                  {t.dashboard.assignToFreight}
                  {selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                </Text>
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
            </>
          )}
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

      {freightModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.dashboard.assignToFreight}</Text>

            <View style={styles.modalTabs}>
              <TouchableOpacity
                style={[
                  styles.modalTab,
                  freightModalMode === 'existing' && styles.modalTabActive,
                ]}
                onPress={() => setFreightModalMode('existing')}>
                <Text
                  style={[
                    styles.modalTabText,
                    freightModalMode === 'existing' && styles.modalTabTextActive,
                  ]}>
                  {t.dashboard.existingFreight}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalTab,
                  freightModalMode === 'new' && styles.modalTabActive,
                ]}
                onPress={() => setFreightModalMode('new')}>
                <Text
                  style={[
                    styles.modalTabText,
                    freightModalMode === 'new' && styles.modalTabTextActive,
                  ]}>
                  {t.dashboard.newFreight}
                </Text>
              </TouchableOpacity>
            </View>

            {freightModalMode === 'existing' ? (
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>{t.dashboard.selectFreight}</Text>
                <select
                  style={styles.modalSelect}
                  value={selectedFreightId}
                  onChange={(e) => setSelectedFreightId(e.target.value)}>
                  {freights.map((freight) => (
                    <option key={freight.id} value={freight.id}>
                      {freight.freight_number} — {new Date(freight.load_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </View>
            ) : (
              <>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>{t.dashboard.loadDate}</Text>
                  <input
                    type="datetime-local"
                    style={styles.modalInput}
                    value={newFreightLoadDate}
                    onChange={(e) => setNewFreightLoadDate(e.target.value)}
                  />
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>{t.dashboard.notes}</Text>
                  <input
                    type="text"
                    style={styles.modalInput}
                    value={newFreightNotes}
                    onChange={(e) => setNewFreightNotes(e.target.value)}
                    placeholder={t.dashboard.notes}
                  />
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setFreightModalVisible(false)}>
                <Text style={styles.modalButtonSecondaryText}>{t.dashboard.cancel || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={
                  freightModalMode === 'existing'
                    ? handleAssignExistingFreight
                    : handleCreateAndAssignFreight
                }>
                <Text style={styles.modalButtonText}>{t.dashboard.confirm || 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {lightboxImages && (
        <div
          style={styles.lightboxOverlay}
          onClick={() => setLightboxImages(null)}
          role="button"
          tabIndex={0}>
          <View style={styles.lightboxContent}>
            <button
              type="button"
              onClick={() => setLightboxImages(null)}
              style={styles.lightboxCloseButton}>
              ×
            </button>
            <View style={{ flexDirection: 'row', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
              {lightboxImages.map((uri, index) => (
                <img
                  key={index}
                  src={uri}
                  alt=""
                  style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }}
                />
              ))}
            </View>
          </View>
        </div>
      )}
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginLeft: 8,
  },
  statusBadgeSaving: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeSaved: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeError: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  statusDotSaving: {
    backgroundColor: '#F59E0B',
  },
  statusDotSaved: {
    backgroundColor: '#10B981',
  },
  statusDotError: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
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
  exportModeSelect: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#1f2937',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  modalTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modalTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  modalTabActive: {
    backgroundColor: '#007AFF',
  },
  modalTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  modalTabTextActive: {
    color: '#FFFFFF',
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  modalSelect: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#F9FAFB',
  },
  modalInput: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#F9FAFB',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalButtonSecondary: {
    backgroundColor: '#F2F2F7',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonSecondaryText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  lightboxOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  lightboxContent: {
    position: 'relative',
    padding: 20,
  },
  lightboxCloseButton: {
    position: 'absolute',
    top: -40,
    right: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#fff',
    fontSize: 36,
    cursor: 'pointer',
  },
});
