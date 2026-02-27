import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function MapLocationPicker({ isOpen, onClose, suppliers }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [nearbySuppliers, setNearbySuppliers] = useState([]);
  const [searchRadius, setSearchRadius] = useState(20);

  // Center of Israel (approximately)
  const israelCenter = { lat: 31.7683, lng: 35.2137 };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const geocodeAddress = async (address) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Convert this Israeli address to latitude and longitude coordinates: "${address}". 
        Return ONLY a JSON object with this exact format: {"lat": number, "lng": number}. 
        If you cannot determine the coordinates, return {"lat": null, "lng": null}.`,
        response_json_schema: {
          type: "object",
          properties: {
            lat: { type: ["number", "null"] },
            lng: { type: ["number", "null"] },
          },
        },
      });
      return result;
    } catch (error) {
      console.error("Geocoding error:", error);
      return { lat: null, lng: null };
    }
  };

  const handleSearch = async () => {
    if (!selectedLocation) return;

    setIsSearching(true);
    setNearbySuppliers([]);

    try {
      const suppliersWithCoords = await Promise.all(
        suppliers.map(async (supplier) => {
          if (!supplier.address) return null;

          const coords = await geocodeAddress(supplier.address);
          if (!coords.lat || !coords.lng) return null;

          const distance = calculateDistance(
            selectedLocation.lat,
            selectedLocation.lng,
            coords.lat,
            coords.lng
          );

          return {
            ...supplier,
            coordinates: coords,
            distance: distance,
          };
        })
      );

      const validSuppliers = suppliersWithCoords
        .filter((s) => s !== null && s.distance <= searchRadius)
        .sort((a, b) => a.distance - b.distance);

      setNearbySuppliers(validSuppliers);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedLocation(null);
      setNearbySuppliers([]);
    }
  }, [isOpen]);

  const getCategoryLabel = (category) => {
    const categories = {
      windows: "חלונות ודלתות",
      tiles: "ריצוף וחיפויים",
      kitchen: "מטבחים",
      sanitary: "סניטציה",
      ac: "מזגנים",
      electrical: "ציוד חשמלי",
      carpentry: "נגרות",
      plumbing: "אינסטלציה",
      painting: "צביעה",
      other: "אחר",
    };
    return categories[category] || category;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            בחר מיקום על המפה
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            לחץ על המפה כדי לבחור את המיקום שלך ולמצוא ספקים קרובים
          </p>
        </DialogHeader>

        <div className="px-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">רדיוס חיפוש:</label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5 ק"מ</option>
                <option value={10}>10 ק"מ</option>
                <option value={20}>20 ק"מ</option>
                <option value={50}>50 ק"מ</option>
                <option value={100}>100 ק"מ</option>
              </select>
            </div>

            {selectedLocation && (
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 ms-2 animate-spin" />
                    מחפש...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 ms-2" />
                    חפש ספקים
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Map */}
          <div className="h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-gray-200 shadow-lg mb-4">
            <MapContainer
              center={[israelCenter.lat, israelCenter.lng]}
              zoom={8}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
              touchZoom={true}
              dragging={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <LocationMarker position={selectedLocation} setPosition={setSelectedLocation} />
            </MapContainer>
          </div>

          {/* Results */}
          {nearbySuppliers.length > 0 && (
            <div className="max-h-[300px] overflow-y-auto mb-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">
                נמצאו {nearbySuppliers.length} ספקים קרובים
              </h3>
              <div className="space-y-3">
                {nearbySuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-800">{supplier.name}</h4>
                        <p className="text-sm text-gray-600">{getCategoryLabel(supplier.category)}</p>
                      </div>
                      <div className="text-start">
                        <p className="text-sm font-semibold text-blue-600">
                          {supplier.distance.toFixed(1)} ק"מ
                        </p>
                      </div>
                    </div>
                    {supplier.contact_phone && (
                      <p className="text-sm text-gray-600">
                        📞 {supplier.contact_phone}
                      </p>
                    )}
                    {supplier.address && (
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {supplier.address}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isSearching && nearbySuppliers.length === 0 && selectedLocation && (
            <div className="text-center py-8 mb-4">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">לחץ על "חפש ספקים" כדי למצוא ספקים באזור שבחרת</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 pt-0 border-t">
          <Button variant="outline" onClick={onClose}>
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}