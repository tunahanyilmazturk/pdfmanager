// -------------------------------------------------------
// state.js – Global uygulama durumu
// -------------------------------------------------------
const AppState = {
  pdfFiles: [],
  selectedIds: new Set(),
  filteredIds: null,
  activeCategory: '',
  customSort: false,
  currentInfoFileId: null,
  printerList: [],
  categories: [],
  mergeItems: [],
  confirmCallback: null,
  dragSourceId: null,
  viewMode: 'list',          // 'list' | 'grid'
  contextMenuTarget: null,   // sag tiklanan ogenin id'si
};
window.AppState = AppState;
