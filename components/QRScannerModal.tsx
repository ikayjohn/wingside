"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }: QRScannerModalProps) {
  const [error, setError] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleClose = useCallback(() => {
    if (scannerRef.current && isScanning) {
      scannerRef.current.stop().catch((err) => {
        console.error("Error stopping scanner:", err);
      });
      setIsScanning(false);
    }
    onClose();
  }, [isScanning, onClose]);

  useEffect(() => {
    if (!isOpen) {
      // Stop scanning when modal is closed
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch((err) => {
          console.error("Error stopping scanner:", err);
        });
        setIsScanning(false);
      }
      return;
    }

    // Start scanning when modal opens
    const startScanner = async () => {
      try {
        setError("");

        // Initialize the scanner
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        // Get camera list first
        const cameras = await Html5Qrcode.getCameras();

        if (cameras && cameras.length > 0) {
          const cameraId = cameras[0].id;

          // Start scanning
          await scanner.start(
            cameraId,
            {
              fps: 10, // Frames per second
              qrbox: { width: 250, height: 250 }, // Scanning box size
            },
            (decodedText) => {
              // Success callback
              onScanSuccess(decodedText);
              handleClose();
            },
            (errorMessage) => {
              // Error callback (ignored - happens every frame when no QR code is found)
            }
          );
          setIsScanning(true);
        } else {
          setError("No camera found on this device");
        }
      } catch (err) {
        console.error("Error starting scanner:", err);
        setError("Unable to access camera. Please ensure camera permissions are granted.");
      }
    };

    startScanner();

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch((err) => {
          console.error("Error stopping scanner:", err);
        });
      }
    };
  }, [isOpen, onScanSuccess, isScanning, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#552627]">Scan QR Code</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <p className="text-gray-600 mb-4">
          Position the QR code on the back of your gift card within the scanning area below.
        </p>

        {/* QR Scanner */}
        <div className="mb-4">
          <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Cancel Button */}
        <button
          onClick={handleClose}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-full transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
