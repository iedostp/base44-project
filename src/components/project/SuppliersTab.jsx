import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Plus, GitCompare, MapPin, Map, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useModalState } from "../useModalState";
import SupplierCard from "./SupplierCard";
import CompareSuppliers from "./CompareSuppliers";
import NearbySuppliers from "./NearbySuppliers";
import MapLocationPicker from "./MapLocationPicker";
import AddSupplierDialog from "./AddSupplierDialog";
import EditSupplierDialog from "./EditSupplierDialog";

export default function SuppliersTab({ suppliers, onAddSupplier, onUpdate, projectId }) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [editingSupplier, setEditingSupplier] = useState(null);
  
  // Use URL-based modal state
  const addSupplierModal = useModalState('addSupplier');
  const nearbyModal = useModalState('nearbySuppliers');
  const mapPickerModal = useModalState('mapPicker');
  const compareModal = useModalState('compareSuppliers');
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const queryClient = useQueryClient();
  const PULL_THRESHOLD = 80;

  const categories = [
    { value: 'all', label: t('all') },
    { value: 'windows', label: t('supplierCat_windows') },
    { value: 'tiles', label: t('supplierCat_tiles') },
    { value: 'kitchen', label: t('supplierCat_kitchen') },
    { value: 'sanitary', label: t('supplierCat_sanitary') },
    { value: 'ac', label: t('supplierCat_ac') },
    { value: 'electrical', label: t('supplierCat_electrical') },
    { value: 'carpentry', label: t('supplierCat_carpentry') },
    { value: 'plumbing', label: t('supplierCat_plumbing') },
    { value: 'painting', label: t('supplierCat_painting') }
  ];

  const filteredSuppliers = selectedCategory === 'all' 
    ? suppliers 
    : suppliers.filter(s => s.category === selectedCategory);

  const handleToggleCompare = (supplier) => {
    setSelectedForCompare(prev => {
      const isSelected = prev.some(s => s.id === supplier.id);
      if (isSelected) {
        return prev.filter(s => s.id !== supplier.id);
      } else {
        // Only allow comparison of suppliers in the same category
        if (prev.length > 0 && prev[0].category !== supplier.category) {
          return [supplier]; // Start new comparison with different category
        }
        return [...prev, supplier];
      }
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.length > 1) {
      compareModal.open();
    }
  };

  const clearSelection = () => {
    setSelectedForCompare([]);
  };

  const handleTouchStart = (e) => {
    const scrollTop = window.scrollY;
    if (scrollTop === 0) {
      setPullDistance(0);
    }
  };

  const handleTouchMove = (e) => {
    const scrollTop = window.scrollY;
    if (scrollTop === 0 && !isPulling) {
      const touch = e.touches[0];
      const startY = touch.clientY;
      setPullDistance(Math.max(0, Math.min(startY / 3, PULL_THRESHOLD)));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setIsPulling(true);
      await queryClient.invalidateQueries();
      setTimeout(() => {
        setIsPulling(false);
        setPullDistance(0);
      }, 500);
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div 
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-slate-700"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {pullDistance > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: pullDistance / PULL_THRESHOLD }}
          className="flex justify-center py-4"
        >
          <motion.div
            animate={{ rotate: isPulling ? 360 : (pullDistance / PULL_THRESHOLD) * 180 }}
            transition={{ duration: isPulling ? 0.6 : 0 }}
          >
            <RefreshCw 
              className={`w-6 h-6 ${isPulling ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`}
            />
          </motion.div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            className="flex-1 md:flex-none bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-md text-xs md:text-sm"
            onClick={() => mapPickerModal.open()}
          >
            <Map className="w-4 h-4 ml-2" />
            {t('pickLocationOnMap')}
          </Button>
          <Button 
            className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md text-xs md:text-sm"
            onClick={() => nearbyModal.open()}
          >
            <MapPin className="w-4 h-4 ml-2" />
            {t('findNearbySuppliers')}
          </Button>
          <Button 
            className="flex-1 md:flex-none bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md text-xs md:text-sm"
            onClick={() => addSupplierModal.open()}
          >
            <Plus className="w-4 h-4 ml-2" />
            {t('addNewSupplier')}
          </Button>
        </div>
        <div className="text-right">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 mb-1">{t('supplierManagement')}</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">{t('supplierManagementDesc')}</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-gray-200 flex-row-reverse justify-end" dir="rtl">
        {categories.map(cat => (
          <button
            key={cat.value}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              selectedCategory === cat.value 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Compare Bar */}
      {selectedForCompare.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{selectedForCompare.length} {t('suppliersSelectedForCompare')}</p>
                <p className="text-xs text-blue-100">{t('selectAtLeast2ToCompare')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={clearSelection} className="text-white hover:bg-white/20">
                {t('clearAll')}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCompare} disabled={selectedForCompare.length < 2} className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                <GitCompare className="w-4 h-4 ml-2" />
                {t('compareSelected')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers Grid */}
      {filteredSuppliers.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-5">
          {filteredSuppliers.map(supplier => (
            <SupplierCard 
              key={supplier.id} 
              supplier={supplier}
              isSelected={selectedForCompare.some(s => s.id === supplier.id)}
              onToggleCompare={handleToggleCompare}
              onUpdate={(s) => setEditingSupplier(s)}
              onDelete={(s) => {
                if (confirm(`${t('confirmDeleteSupplier')} "${s.name}"?`)) {
                  base44.entities.Supplier.delete(s.id).then(() => {
                    if (onUpdate) onUpdate();
                  });
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg mb-2">{t('noSuppliersInCategory')}</p>
          <p className="text-gray-400 text-sm">{t('clickAddSupplierToStart')}</p>
        </div>
      )}

      {/* Compare Modal */}
      <CompareSuppliers
        suppliers={selectedForCompare}
        isOpen={compareModal.isOpen}
        onClose={compareModal.close}
      />

      {/* Nearby Suppliers Modal */}
      <NearbySuppliers
        suppliers={suppliers}
        isOpen={nearbyModal.isOpen}
        onClose={nearbyModal.close}
      />

      {/* Map Location Picker Modal */}
      <MapLocationPicker
        suppliers={suppliers}
        isOpen={mapPickerModal.isOpen}
        onClose={mapPickerModal.close}
      />

      {/* Add Supplier Dialog */}
      <AddSupplierDialog
        isOpen={addSupplierModal.isOpen}
        onClose={addSupplierModal.close}
        projectId={projectId}
        onSupplierAdded={onUpdate}
      />

      {/* Edit Supplier Dialog */}
      <EditSupplierDialog
        isOpen={!!editingSupplier}
        onClose={() => setEditingSupplier(null)}
        supplier={editingSupplier}
        onSupplierUpdated={onUpdate}
      />
    </div>
  );
}