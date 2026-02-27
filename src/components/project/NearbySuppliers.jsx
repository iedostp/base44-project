import React, { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2, AlertCircle, Phone, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";

export default function NearbySuppliers({ suppliers, isOpen, onClose }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(20); // km
  const [nearbySuppliersData, setNearbySuppliersData] = useState([]);
  const [geocoding, setGeocoding] = useState(false);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Get coordinates from address using AI
  const geocodeAddress = async (address) => {
    try {
      const prompt = `
החזר את הקואורדינטות (latitude, longitude) של הכתובת הבאה בישראל:
"${address}"

החזר רק את המספרים בפורמט JSON.
אם לא מצאת את הכתובת המדויקת, החזר את הקואורדינטות של העיר או האזור הכללי.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
            confidence: { type: "string", enum: ["high", "medium", "low"] }
          }
        }
      });

      if (response.latitude && response.longitude) {
        return {
          lat: response.latitude,
          lng: response.longitude,
          confidence: response.confidence
        };
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
    return null;
  };

  // Get user's current location
  const getUserLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("הדפדפן שלך לא תומך במיקום גיאוגרפי");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("לא הצלחנו לקבל את המיקום שלך. אנא אפשר גישה למיקום בהגדרות הדפדפן");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Find nearby suppliers when location changes
  useEffect(() => {
    if (location && suppliers.length > 0) {
      findNearbySuppliers();
    }
  }, [location, suppliers, radius]);

  const findNearbySuppliers = async () => {
    setGeocoding(true);
    const suppliersWithDistance = [];

    for (const supplier of suppliers) {
      if (!supplier.address) continue;

      // Try to geocode the address
      const coords = await geocodeAddress(supplier.address);
      
      if (coords) {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          coords.lat,
          coords.lng
        );

        if (distance <= radius) {
          suppliersWithDistance.push({
            ...supplier,
            distance: distance,
            coordinates: coords
          });
        }
      }
    }

    // Sort by distance
    suppliersWithDistance.sort((a, b) => a.distance - b.distance);
    setNearbySuppliersData(suppliersWithDistance);
    setGeocoding(false);
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

  const openInMaps = (supplier) => {
    if (supplier.coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lng}&destination=${supplier.coordinates.lat},${supplier.coordinates.lng}`;
      window.open(url, '_blank');
    } else if (supplier.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(supplier.address)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2 justify-center text-center">
            <MapPin className="w-6 h-6 text-blue-600" />
            מצא ספקים באזור שלך
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1 text-center">
            אתר ספקים קרובים למיקום הנוכחי שלך
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Get Location Button */}
          {!location && (
            <div className="text-center p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <Navigation className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">
                אנא אפשר גישה למיקום
              </h3>
              <p className="text-gray-600 text-sm mb-4 text-center">
                נשתמש במיקום שלך כדי למצוא ספקים קרובים באזור
              </p>
              <Button
                onClick={getUserLocation}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מאתר מיקום...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 ml-2" />
                    אתר את המיקום שלי
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">שגיאה בקבלת מיקום</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Location Found */}
          {location && (
            <>
              {/* Radius Selector */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 text-right">
                    רדיוס חיפוש
                  </label>
                  <span className="text-lg font-bold text-blue-600">
                    {radius} ק"מ
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>5 ק"מ</span>
                  <span>50 ק"מ</span>
                </div>
              </div>

              {/* Loading Geocoding */}
              {geocoding && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">מאתר ספקים...</p>
                      <p className="text-xs text-blue-700">מחשב מרחקים וממיין לפי קרבה</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nearby Suppliers */}
              {!geocoding && nearbySuppliersData.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-right">
                    נמצאו {nearbySuppliersData.length} ספקים באזור שלך
                  </h3>
                  <div className="space-y-4">
                    {nearbySuppliersData.map((supplier, index) => (
                      <div
                        key={supplier.id}
                        className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-bold text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-800 mb-1 text-right">
                                {supplier.name}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                  {getCategoryText(supplier.category)}
                                </span>
                                {supplier.rating && (
                                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                                    <span className="text-xs font-semibold text-amber-700">
                                      {supplier.rating}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                              {supplier.distance.toFixed(1)} ק"מ
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              ~{Math.round(supplier.distance * 2)} דק' נסיעה
                            </p>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="flex-1 text-right">{supplier.address}</span>
                        </div>

                        {/* Contact Info */}
                        {supplier.contact_phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span dir="ltr">{supplier.contact_phone}</span>
                          </div>
                        )}

                        {/* Price Range */}
                        {supplier.price_range && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-3">
                            <span className="text-xs font-medium text-purple-800">
                              טווח מחירים: {supplier.price_range}
                            </span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.open(`tel:${supplier.contact_phone}`)}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                            size="sm"
                          >
                            <Phone className="w-3 h-3 ml-2" />
                            התקשר
                          </Button>
                          <Button
                            onClick={() => openInMaps(supplier)}
                            variant="outline"
                            className="flex-1"
                            size="sm"
                          >
                            <ExternalLink className="w-3 h-3 ml-2" />
                            נווט במפות
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Suppliers Found */}
              {!geocoding && nearbySuppliersData.length === 0 && (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    לא נמצאו ספקים ברדיוס זה
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    נסה להגדיל את רדיוס החיפוש או הוסף ספקים עם כתובות מדויקות
                  </p>
                  <Button
                    onClick={() => setRadius(Math.min(radius + 10, 50))}
                    variant="outline"
                  >
                    הגדל רדיוס ל-{Math.min(radius + 10, 50)} ק"מ
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}