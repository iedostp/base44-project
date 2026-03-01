import React from "react";
import { Star, MapPin, Phone, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function SupplierCard({ supplier, onStatusChange, isSelected, onToggleCompare, onUpdate, onDelete }) {
  // Get current user
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Check if user can edit this supplier
  const canEdit = () => {
    if (!user || !supplier) return false;
    
    // Check if supplier was created by current user
    if (supplier.created_by !== user.email) return false;
    
    // Check if less than 24 hours have passed since creation
    const createdDate = new Date(supplier.created_date);
    const now = new Date();
    const hoursPassed = (now - createdDate) / (1000 * 60 * 60);
    
    return hoursPassed < 24;
  };
  const getCategoryText = (category) => {
    const categories = {
      'windows': 'חלונות ודלתות',
      'tiles': 'ריצוף וחיפויים',
      'kitchen': 'מטבחים',
      'sanitary': 'סניטציה',
      'ac': 'מזגנים',
      'electrical': 'ציוד חשמלי',
      'carpentry': 'נגרות',
      'plumbing': 'אינסטלציה',
      'painting': 'צביעה',
      'other': 'אחר'
    };
    return categories[category] || category;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'selected': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'under_consideration': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'selected': return 'נבחר ✓';
      case 'under_consideration': return 'בבדיקה';
      case 'rejected': return 'נדחה';
      default: return 'לא יצרנו קשר';
    }
  };

  return (
    <div dir="rtl" className={`border rounded-2xl p-5 transition-all duration-300 bg-white dark:bg-slate-800 relative select-none flex flex-col ${
      isSelected ? 'border-blue-500 dark:border-blue-400 shadow-xl ring-2 ring-blue-200 dark:ring-blue-700' : 'border-gray-200 dark:border-slate-700 hover:shadow-xl'
    }`}>
      {/* Compare Checkbox */}
      <div className="absolute top-4 end-4 z-10">
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-md border border-gray-200">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={() => onToggleCompare(supplier)}
            id={`compare-${supplier.id}`}
            className="border-2"
          />
          <label 
            htmlFor={`compare-${supplier.id}`}
            className="text-xs font-medium text-gray-700 cursor-pointer"
          >
            השווה
          </label>
        </div>
      </div>

      {/* Supplier name - right aligned (text-start = inline-start = right in RTL) */}
      <h3 className="font-bold text-xl text-gray-800 dark:text-slate-100 text-right mt-8 mb-3">{supplier.name}</h3>

      {/* Category, rating, price range, status - all on one row */}
      <div dir="rtl" className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
          {getCategoryText(supplier.category)}
        </span>
        {supplier.rating && (
          <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <span className="text-sm font-semibold text-amber-700">{supplier.rating}</span>
          </div>
        )}
        {supplier.price_range && (
          <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
            {supplier.price_range}
          </span>
        )}
        <span className={`text-xs px-3 py-1.5 rounded-full font-medium border ${getStatusColor(supplier.status)}`}>
          {getStatusText(supplier.status)}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        {supplier.address && (
          <div dir="rtl" className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{supplier.address}</span>
          </div>
        )}
        {supplier.contact_phone && (
          <div dir="rtl" className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
            <span dir="ltr">{supplier.contact_phone}</span>
          </div>
        )}
        {supplier.email && (
          <div dir="rtl" className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{supplier.email}</span>
          </div>
        )}
      </div>
      
      <div className="flex-1">
        {supplier.notes && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 mb-4 border border-blue-100">
            <p className="text-sm text-gray-700 leading-relaxed text-right">{supplier.notes}</p>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-4">
        <Button 
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          onClick={() => window.open(`tel:${supplier.contact_phone}`)}
        >
          צור קשר
        </Button>
        {canEdit() && (
          <>
            <Button 
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                if (onUpdate) onUpdate(supplier);
              }}
            >
              עריכה
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete(supplier);
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}