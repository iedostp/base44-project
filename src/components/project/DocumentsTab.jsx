import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, FolderOpen, GitCompare, List, LayoutGrid, FolderPlus, Folder, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModalState } from "../useModalState";
import DocumentCard from "./DocumentCard";
import DocumentUpload from "./DocumentUpload";
import QuoteCompare from "./QuoteCompare";
import { format } from "date-fns";

function DocumentListRow({ document, stage, supplier, onDelete, isSelected, onSelect, onDragStart, onDragEnd }) {
  const { t } = useTranslation();
  const getCategoryText = (cat) => t(`docCat_${cat}_single`, { defaultValue: /** @type {string} */ (t(`docCat_${cat}`, cat)) });

  const getCategoryColor = (cat) => ({
    contract:'bg-purple-100 text-purple-800', permit:'bg-green-100 text-green-800',
    invoice:'bg-blue-100 text-blue-800', plan:'bg-orange-100 text-orange-800',
    specification:'bg-cyan-100 text-cyan-800', certificate:'bg-emerald-100 text-emerald-800',
    correspondence:'bg-amber-100 text-amber-800', other:'bg-gray-100 text-gray-800'
  })[cat] || 'bg-gray-100 text-gray-800';

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
      <input type="checkbox" className="rounded" checked={isSelected} onChange={e => onSelect && onSelect(e, document)} onClick={e => e.stopPropagation()} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{document.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(document.category)}`}>{getCategoryText(document.category)}</span>
          {stage && <span className="text-xs text-gray-500">{t('docsStageLabel')} {stage.title}</span>}
          {supplier && <span className="text-xs text-gray-500">{t('docsSupplierLabel')} {supplier.name}</span>}
          <span className="text-xs text-gray-400">{format(new Date(document.created_date), 'dd/MM/yyyy')}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50 h-7 px-2 text-xs"
          onClick={() => window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(document.file_url)}`, '_blank')}>
          {t('view')}
        </Button>
        <Button size="sm" variant="ghost" className="text-gray-600 hover:bg-gray-50 h-7 px-2 text-xs"
          onClick={() => {
            const a = window.document.createElement('a');
            a.href = document.file_url;
            a.download = document.name;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            window.document.body.appendChild(a);
            a.click();
            window.document.body.removeChild(a);
          }}>
          {t('download', 'הורד')}
        </Button>
        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7 w-7 p-0" onClick={() => onDelete(document)}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}

export default function DocumentsTab({ documents, stages, suppliers, projectId, project, onDocumentAdded, onDocumentDeleted }) {
  const { t, i18n } = useTranslation();
  const isRTL = ['he', 'ar'].includes(i18n.language);
  const uploadModal = useModalState('uploadDocument');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [showCompare, setShowCompare] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('date-desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [folders, setFolders] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`doc_folders_${projectId}`) || '[]'); } catch { return []; }
  });
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [draggedDocIds, setDraggedDocIds] = useState([]);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const ghostRef = useRef(null);

  const saveFolders = (newFolders) => {
    setFolders(newFolders);
    localStorage.setItem(`doc_folders_${projectId}`, JSON.stringify(newFolders));
  };

  useEffect(() => {
    if (folders.length === 0) {
      saveFolders([
        { id: 'f-cert',  name: t('docCat_certificate'),   docIds: [] },
        { id: 'f-plan',  name: t('docCat_plan'),          docIds: [] },
        { id: 'f-corr',  name: t('docCat_correspondence'), docIds: [] },
        { id: 'f-inv',   name: t('docCat_invoice'),       docIds: [] },
        { id: 'f-cont',  name: t('docCat_contract'),      docIds: [] },
        { id: 'f-perm',  name: t('docCat_permit'),        docIds: [] },
        { id: 'f-other', name: t('docCat_other'),         docIds: [] },
      ]);
    }
  }, []);

  const addFolder = () => {
    if (!newFolderName.trim()) return;
    saveFolders([...folders, { id: Date.now().toString(), name: newFolderName.trim(), docIds: [] }]);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const deleteFolder = (folderId) => {
    saveFolders(folders.filter(f => f.id !== folderId));
    if (selectedFolder === folderId) setSelectedFolder('all');
  };

  const assignDocToFolder = (docId, folderId) => {
    saveFolders(folders.map(f =>
      f.id === folderId
        ? { ...f, docIds: [...new Set([...f.docIds, docId])] }
        : { ...f, docIds: f.docIds.filter(id => id !== docId) }
    ));
  };

  const removeDocFromFolders = (docId) => {
    saveFolders(folders.map(f => ({ ...f, docIds: f.docIds.filter(id => id !== docId) })));
  };

  const assignDocsToFolder = (docIds, folderId) => {
    saveFolders(folders.map(f =>
      f.id === folderId
        ? { ...f, docIds: [...new Set([...f.docIds, ...docIds])] }
        : { ...f, docIds: f.docIds.filter(id => !docIds.includes(id)) }
    ));
  };

  const removeDocsFromFolders = (docIds) => {
    saveFolders(folders.map(f => ({ ...f, docIds: f.docIds.filter(id => !docIds.includes(id)) })));
  };

  const handleDocDragStart = (e, doc) => {
    const isInSelection = selectedForCompare.some(d => d.id === doc.id);
    const ids = isInSelection ? selectedForCompare.map(d => d.id) : [doc.id];
    if (!isInSelection) setSelectedForCompare([]);
    setDraggedDocIds(ids);
    if (ghostRef.current) {
      ghostRef.current.textContent = ids.length > 1 ? `${t('docsMoveGhost')} ${ids.length}` : t('docsMoveGhost');
      e.dataTransfer.setDragImage(ghostRef.current, 60, 20);
    }
  };

  const handleFolderDrop = (folderId) => {
    if (!draggedDocIds.length) return;
    if (folderId === 'all') removeDocsFromFolders(draggedDocIds);
    else assignDocsToFolder(draggedDocIds, folderId);
    setSelectedForCompare([]);
    setDraggedDocIds([]);
    setDragOverFolderId(null);
  };

  const toggleCompare = (doc) => {
    setSelectedForCompare(prev =>
      prev.find(d => d.id === doc.id) ? prev.filter(d => d.id !== doc.id) : [...prev, doc]
    );
  };

  const categories = [
    { value: 'all', label: t('all'), count: documents.length },
    { value: 'contract', label: t('docCat_contract') },
    { value: 'permit', label: t('docCat_permit') },
    { value: 'invoice', label: t('docCat_invoice') },
    { value: 'plan', label: t('docCat_plan') },
    { value: 'specification', label: t('docCat_specification') },
    { value: 'certificate', label: t('docCat_certificate') },
    { value: 'correspondence', label: t('docCat_correspondence') },
    { value: 'other', label: t('docCat_other') },
  ];

  const filteredDocuments = documents.filter(doc => {
    const categoryMatch = selectedCategory === 'all' || doc.category === selectedCategory;
    const stageMatch = selectedStage === 'all' || doc.stage_id === selectedStage;
    const searchMatch = !searchQuery || doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const dateFromMatch = !dateFrom || new Date(doc.created_date) >= new Date(dateFrom);
    const dateToMatch = !dateTo || new Date(doc.created_date) <= new Date(dateTo + 'T23:59:59');
    const folderMatch = selectedFolder === 'all' || (folders.find(f => f.id === selectedFolder)?.docIds || []).includes(doc.id);
    return categoryMatch && stageMatch && searchMatch && dateFromMatch && dateToMatch && folderMatch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':  return new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
      case 'name-asc':  return a.name.localeCompare(b.name, 'he');
      case 'name-desc': return b.name.localeCompare(a.name, 'he');
      case 'size-desc': return (b.file_size || 0) - (a.file_size || 0);
      case 'size-asc':  return (a.file_size || 0) - (b.file_size || 0);
      default:          return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
    }
  });

  const allVisibleSelected = filteredDocuments.length > 0 &&
    filteredDocuments.every(d => selectedForCompare.some(s => s.id === d.id));

  const handleSelectAll = () => {
    if (allVisibleSelected) setSelectedForCompare([]);
    else setSelectedForCompare(filteredDocuments);
    setLastSelectedIndex(null);
  };

  const handleDeleteSelected = () => {
    if (!confirm(`${t('docsDeleteSelected')} ${selectedForCompare.length} ${t('documents')}?`)) return;
    selectedForCompare.forEach(doc => onDocumentDeleted(doc));
    setSelectedForCompare([]);
    setLastSelectedIndex(null);
  };

  const handleDocSelect = (e, doc, index) => {
    if (e.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = new Set(filteredDocuments.slice(start, end + 1).map(d => d.id));
      const merged = [...new Set([...selectedForCompare.map(d => d.id), ...rangeIds])];
      setSelectedForCompare(filteredDocuments.filter(d => merged.includes(d.id)));
    } else {
      toggleCompare(doc);
      setLastSelectedIndex(index);
    }
  };

  const hasDateFilter = dateFrom || dateTo;
  const hasActiveFilter = searchQuery || selectedCategory !== 'all' || selectedStage !== 'all' || hasDateFilter || selectedFolder !== 'all';

  return (
    <div className="space-y-4 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-5 border border-gray-100 dark:border-slate-700">
        <div dir={isRTL ? 'rtl' : 'ltr'} className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-3">
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">{t('documentManagement')}</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm">{t('documentManagementDesc')}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md" onClick={() => uploadModal.open()} size="sm">
              <Plus className="w-4 h-4 me-1" />
              {t('uploadDocument')}
            </Button>
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder={t('searchDocuments')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 text-right" />
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map(cat => (
            <button key={cat.value} onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedCategory === cat.value ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200'}`}>
              {cat.label} {cat.value === 'all' ? `(${documents.length})` : `(${documents.filter(d => d.category === cat.value).length})`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stages.length > 0 && (
            <select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-xs bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300">
              <option value="all">{t('allStages')}</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          )}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-xs bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300">
            <option value="date-desc">{t('sortDateDesc')}</option>
            <option value="date-asc">{t('sortDateAsc')}</option>
            <option value="name-asc">{t('sortNameAsc')}</option>
            <option value="name-desc">{t('sortNameDesc')}</option>
            <option value="size-desc">{t('sortSizeDesc')}</option>
            <option value="size-asc">{t('sortSizeAsc')}</option>
          </select>
          <button onClick={() => setShowDateFilter(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${hasDateFilter ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
            <Calendar className="w-3.5 h-3.5" />
            {hasDateFilter ? t('activeDateRange') : t('filterByDate')}
            {hasDateFilter && <span className="me-1 text-red-500" onClick={(e) => { e.stopPropagation(); setDateFrom(''); setDateTo(''); }}>×</span>}
          </button>
        </div>

        {showDateFilter && (
          <div className="mt-3 flex flex-wrap items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 dark:text-slate-300 font-medium">{t('fromDate')}:</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1 border border-gray-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 dark:text-slate-300 font-medium">{t('toDate')}:</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1 border border-gray-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200" />
            </div>
            {hasDateFilter && <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-red-500 hover:text-red-700 underline">{t('clear')}</button>}
          </div>
        )}
      </div>

      {/* Folders */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 dark:text-slate-200 text-sm flex items-center gap-2">
            <Folder className="w-4 h-4 text-amber-500" />{t('folders')}
          </h3>
          <button onClick={() => setShowNewFolder(v => !v)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <FolderPlus className="w-3.5 h-3.5" />{t('newFolder')}
          </button>
        </div>
        {showNewFolder && (
          <div className="flex items-center gap-2 mb-3">
            <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder={t('folderName')} className="h-8 text-sm" onKeyDown={e => e.key === 'Enter' && addFolder()} autoFocus />
            <Button size="sm" onClick={addFolder} className="h-8 bg-blue-600 hover:bg-blue-700 text-white">{t('add')}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="h-8">{t('cancel')}</Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedFolder('all')}
            onDragOver={e => { e.preventDefault(); setDragOverFolderId('all'); }}
            onDragLeave={() => setDragOverFolderId(null)}
            onDrop={e => { e.preventDefault(); handleFolderDrop('all'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedFolder === 'all' ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100'} ${dragOverFolderId === 'all' ? 'ring-2 ring-amber-400 scale-105' : ''}`}>
            <FolderOpen className="w-3.5 h-3.5" />{t('allDocuments')} ({documents.length})
          </button>
          {folders.map(folder => (
            <div key={folder.id} className="relative group">
              <button onClick={() => setSelectedFolder(folder.id)}
                onDragOver={e => { e.preventDefault(); setDragOverFolderId(folder.id); }}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={e => { e.preventDefault(); handleFolderDrop(folder.id); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedFolder === folder.id ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100'} ${dragOverFolderId === folder.id ? 'ring-2 ring-amber-400 scale-105' : ''}`}>
                <Folder className="w-3.5 h-3.5" />{folder.name} ({folder.docIds.length})
              </button>
              <button onClick={() => deleteFolder(folder.id)} className="absolute -top-1.5 -end-1.5 hidden group-hover:flex w-4 h-4 bg-red-500 text-white rounded-full items-center justify-center text-xs leading-none">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Selection toolbar */}
      {selectedForCompare.length > 0 && (
        <div className="sticky top-2 z-20 bg-blue-600 text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl flex-wrap">
          <span className="font-semibold text-sm shrink-0">{selectedForCompare.length} {t('docsSelectedCount')}</span>
          <div className="flex gap-2 me-auto flex-wrap">
            <select defaultValue=""
              onChange={e => { if (!e.target.value) return; assignDocsToFolder(selectedForCompare.map(d => d.id), e.target.value); setSelectedForCompare([]); setLastSelectedIndex(null); e.target.value = ''; }}
              className="text-xs px-2 py-1.5 rounded-lg bg-white/20 text-white border border-white/30 cursor-pointer">
              <option value="">{t('docsMoveTo')}</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            {selectedForCompare.length >= 2 && (
              <button onClick={() => setShowCompare(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 font-medium flex items-center gap-1">
                <GitCompare className="w-3 h-3" /> {t('docsCompare')}
              </button>
            )}
            <button onClick={handleDeleteSelected}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 font-medium">
              {t('docsDeleteSelected')}
            </button>
            <button onClick={() => { setSelectedForCompare([]); setLastSelectedIndex(null); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30">
              {t('docsCancelSelection')}
            </button>
          </div>
        </div>
      )}

      {/* Documents */}
      {filteredDocuments.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
            {filteredDocuments.map(doc => {
              const stage = stages.find(s => s.id === doc.stage_id);
              const supplier = suppliers.find(s => s.id === doc.supplier_id);
              return (
                <div key={doc.id} className="break-inside-avoid mb-4 cursor-grab active:cursor-grabbing" draggable onDragStart={e => handleDocDragStart(e, doc)} onDragEnd={() => { setDraggedDocIds([]); setDragOverFolderId(null); }}>
                  <DocumentCard document={doc} stage={stage} supplier={supplier} project={project} stages={stages} onDelete={onDocumentDeleted} isSelected={!!selectedForCompare.find(d => d.id === doc.id)} onToggleCompare={toggleCompare} />
                  {folders.length > 0 && (
                    <select value={folders.find(f => f.docIds.includes(doc.id))?.id || ''} onChange={e => e.target.value === '' ? removeDocFromFolders(doc.id) : assignDocToFolder(doc.id, e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 mt-1">
                      <option value="">{t('docsNoFolder')}</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-3 bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-600">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" checked={allVisibleSelected}
                  ref={el => { if (el) el.indeterminate = selectedForCompare.length > 0 && !allVisibleSelected; }}
                  onChange={handleSelectAll} />
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{filteredDocuments.length} {t('documents')}</span>
                {selectedForCompare.length > 0 && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">({selectedForCompare.length} {t('docsSelectedCount')})</span>
                )}
              </div>
            </div>
            <div className="p-3 space-y-2">
              {filteredDocuments.map((doc, index) => {
                const stage = stages.find(s => s.id === doc.stage_id);
                const supplier = suppliers.find(s => s.id === doc.supplier_id);
                return <DocumentListRow key={doc.id} document={doc} stage={stage} supplier={supplier} project={project} stages={stages} onDelete={onDocumentDeleted} isSelected={!!selectedForCompare.find(d => d.id === doc.id)} onSelect={(e, d) => handleDocSelect(e, d, index)} onDragStart={e => handleDocDragStart(e, doc)} onDragEnd={() => { setDraggedDocIds([]); setDragOverFolderId(null); }} />;
              })}
            </div>
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-12 text-center border border-gray-200 dark:border-slate-700">
          <FolderOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-2">{hasActiveFilter ? t('noDocumentsFound') : t('noDocumentsYet')}</h3>
          <p className="text-gray-500 dark:text-slate-400 mb-6">{hasActiveFilter ? t('tryChangingFilter') : t('startUploadingDocuments')}</p>
          {!hasActiveFilter && (
            <Button onClick={() => uploadModal.open()} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
              <Plus className="w-4 h-4 ms-2" />{t('uploadFirstDocument')}
            </Button>
          )}
        </div>
      )}

      <DocumentUpload isOpen={uploadModal.isOpen} onClose={uploadModal.close} projectId={projectId} stages={stages} suppliers={suppliers} onUploadComplete={onDocumentAdded} />
      {showCompare && <QuoteCompare documents={selectedForCompare} suppliers={suppliers} onClose={() => setShowCompare(false)} />}

      {/* Drag ghost element */}
      <div ref={ghostRef} style={{ position: 'fixed', top: '-100px', left: 0 }}
        className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-xl text-sm font-bold pointer-events-none" />
    </div>
  );
}