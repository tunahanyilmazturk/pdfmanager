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
};

// Global erisim icin window'a ata
window.AppState = AppState;
