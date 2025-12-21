import React, { useState, useEffect } from "react";
import { X, MapPin, Save, Crosshair, AlertCircle } from "lucide-react";

const LocationMapModal = ({ isOpen, onClose, currentLocation, onSave }) => {
  const [formData, setFormData] = useState({
    lat: "",
    lng: "",
    radius: 200, // Default 200 meters
    address: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill existing data when modal opens
  useEffect(() => {
    if (isOpen && currentLocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        lat: currentLocation.lat || "",
        lng: currentLocation.lng || "",
        radius: currentLocation.radius || 200,
        address: currentLocation.address || ""
      });
    }
    setError("");
  }, [isOpen, currentLocation]);

  // Function to get current location from browser
  const handleGetCurrentLocation = () => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to get location. Ensure GPS is enabled and browser permission is granted.");
        setLoading(false);
      },
      { enableHighAccuracy: true } // Request high accuracy
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.lat || !formData.lng) {
      setError("Please set Latitude and Longitude (or use the 'Set Current Location' button).");
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <MapPin size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Branch Location Settings
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-800">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-3 leading-relaxed">
              Visit the branch site and click the button below to get accurate coordinates, or enter them manually.
            </p>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Crosshair size={18} />
                  Set Current Location
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Latitude (Lat)</label>
              <input
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                placeholder="Ex: 30.0444"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Longitude (Lng)</label>
              <input
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                placeholder="Ex: 31.2357"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Allowed Radius (meters)
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                value={formData.radius}
                onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
              />
              <span className="absolute right-3 top-2.5 text-gray-400 text-sm">m</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">The allowed distance (in meters) for employees to clock in around this location.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Display Address (Optional)</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
              placeholder="e.g., Main Branch - Downtown"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <Save size={18} />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationMapModal;