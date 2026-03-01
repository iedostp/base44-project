import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, FolderOpen, GitCompare, List, LayoutGrid, FolderPlus, Folder, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModalState } from "../useModalState";
import DocumentCard from "./DocumentCard";
import DocumentUpload from "./DocumentUpload";
import QuoteCompare from "./QuoteCompare";
import { format } from "date-fns";

function DocumentListRow({ document, stage, supplier, onDelete, isSelected, onToggleCompare }) {
  const getCategoryText = (cat) => ({
    contract:'חוזה', permit:'היתר', invoice:'חשבונית', plan:'תוכנית',
    specification:'מפרט', certificate:'אישור', correspondence:'התכתבות', other:'אחר'
  })[cat] || 'אחר';

  const getCategoryColor = (cat) => ({
    contract:'bg-purple-100 text-purple-800', permit:'bg-green-100 text-green-800',
    invoice:'bg-blue-100 text-blue-800', plan:'bg-orange-100 text-orange-800',
    specification:'bg-cyan-100 text-cyan-800', certificate:'bg-emerald-100 text-emerald-800',
    correspondence:'bg-amber-100 text-amber-800', other:'bg-gray-100 text-gray-800'
  })[cat] || 'bg-gray-100 text-gray-800';

  return (
    <div dir="rtl" className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
      <input type="checkbox" className="rounded" checked={isSelected} onChange={() => onToggleCompare && onToggleCompare(document)} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{document.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(document.category)}`}>{getCategoryText(document.category)}</span>
          {stage && <span className="text-xs text-gray-500">שלב: {stage.title}</span>}
          {supplier && <span className="text-xs text-gray-500">ספק: {supplier.name}</span>}
          <span className="text-xs text-gray-400">{format(new Date(document.created_date), 'dd/MM/yyyy')}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50 h-7 px-2 text-xs" onClick={() => window.open(document.file_url, '_blank')}>צפה</Button>
        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 h-7 w-7 p-0" onClick={() => onDelete(document)}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}

export default function DocumentsTab({ documents, stages, suppliers, projectId, project, onDocumentAdded, onDocumentDeleted }) {
  const { t } = useTranslation();
  const uploadModal = useModalState('uploadDocument');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [showCompare, setShowCompare] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [folders, setFolders] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`doc_folders_${projectId}`) || '[]'); } catch { return []; }
  });
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const saveFolders = (newFolders) => {
    setFolders(newFolders);
    localStorage.setItem(`doc_folders_${projectId}`, JSON.stringify(newFolders));
  };

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

  const toggleCompare = (doc) => {
    setSelectedForCompare(prev =>
      prev.find(d => d.id === doc.id) ? prev.filter(d => d.id !== doc.id) : prev.length < 5 ? [...prev, doc] : prev
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
  }).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const hasDateFilter = dateFrom || dateTo;
  const hasActiveFilter = searchQuery || selectedCategory !== 'all' || selectedStage !== 'all' || hasDateFilter || selectedFolder !== 'all';

  return (
    <div className="space-y-4 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-5 border border-gray-100 dark:border-slate-700">
        <div dir="rtl" className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-3">
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

        <div dir="rtl" className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder={t('searchDocuments')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 text-right" />
        </div>

        <div dir="rtl" className="flex flex-wrap gap-2 mb-3">
          {categories.map(cat => (
            <button key={cat.value} onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedCategory === cat.value ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200'}`}>
              {cat.label} {cat.value === 'all' ? `(${documents.length})` : `(${documents.filter(d => d.category === cat.value).length})`}
            </button>
          ))}
        </div>

        <div dir="rtl" className="flex flex-wrap items-center gap-2">
          {stages.length > 0 && (
            <select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-xs bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300">
              <option value="all">{t('allStages')}</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          )}
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
        <div dir="rtl" className="flex items-center justify-between mb-3">
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
        <div dir="rtl" className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedFolder('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedFolder === 'all' ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100'}`}>
            <FolderOpen className="w-3.5 h-3.5" />{t('allDocuments')} ({documents.length})
          </button>
          {folders.map(folder => (
            <div key={folder.id} className="relative group">
              <button onClick={() => setSelectedFolder(folder.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedFolder === folder.id ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100'}`}>
                <Folder className="w-3.5 h-3.5" />{folder.name} ({folder.docIds.length})
              </button>
              <button onClick={() => deleteFolder(folder.id)} className="absolute -top-1.5 -start-1.5 hidden group-hover:flex w-4 h-4 bg-red-500 text-white rounded-full items-center justify-center text-xs leading-none">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Compare bar */}
      {selectedForCompare.length > 0 && (
        <div dir="rtl" className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 flex items-center justify-between gap-3">
          <span className="text-sm text-blue-800 dark:text-blue-300 font-medium">{selectedForCompare.length} {t('documentsSelectedForCompare')}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelectedForCompare([])}>{t('clear')}</Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowCompare(true)} disabled={selectedForCompare.length < 2}>
              <GitCompare className="w-3.5 h-3.5 ms-1" />{t('compare')}
            </Button>
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
                <div key={doc.id} className="break-inside-avoid mb-4">
                  <DocumentCard document={doc} stage={stage} supplier={supplier} project={project} stages={stages} onDelete={onDocumentDeleted} isSelected={!!selectedForCompare.find(d => d.id === doc.id)} onToggleCompare={toggleCompare} />
                  {folders.length > 0 && (
                    <select value={folders.find(f => f.docIds.includes(doc.id))?.id || ''} onChange={e => e.target.value === '' ? removeDocFromFolders(doc.id) : assignDocToFolder(doc.id, e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 mt-1">
                      <option value="">ללא תיקייה</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-3 bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-600 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{filteredDocuments.length} {t('documents')}</span>
            </div>
            <div className="p-3 space-y-2">
              {filteredDocuments.map(doc => {
                const stage = stages.find(s => s.id === doc.stage_id);
                const supplier = suppliers.find(s => s.id === doc.supplier_id);
                return <DocumentListRow key={doc.id} document={doc} stage={stage} supplier={supplier} project={project} stages={stages} onDelete={onDocumentDeleted} isSelected={!!selectedForCompare.find(d => d.id === doc.id)} onToggleCompare={toggleCompare} />;
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
    </div>
  );
}