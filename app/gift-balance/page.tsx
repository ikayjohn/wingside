"use client";

import { useState } from "react";
import QRScannerModal from "@/components/QRScannerModal";

export default function GiftBalancePage() {
  const [cardNumber, setCardNumber] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call - replace with actual API
    setTimeout(() => {
      setIsLoading(false);
      alert(`Checking balance for card: ${cardNumber}`);
    }, 1000);
  };

  const handleQRScanSuccess = (decodedText: string) => {
    // Parse the QR code data to extract card number and PIN
    // Assuming QR code contains data like: "cardNumber:1234567890123456,pin:1234"
    // Or JSON: {"cardNumber":"1234567890123456","pin":"1234"}
    // Adjust parsing based on your actual QR code format

    let scannedCardNumber = "";
    let scannedPin = "";

    try {
      // Try to parse as JSON first
      const data = JSON.parse(decodedText);
      scannedCardNumber = data.cardNumber || data.cardNumber || "";
      scannedPin = data.pin || data.pin || "";
    } catch {
      // If not JSON, try to parse key-value format
      const parts = decodedText.split(",");
      parts.forEach((part) => {
        const [key, value] = part.split(":");
        if (key === "cardNumber") {
          scannedCardNumber = value;
        } else if (key === "pin") {
          scannedPin = value;
        }
      });

      // If still no card number, treat entire text as card number
      if (!scannedCardNumber) {
        scannedCardNumber = decodedText;
      }
    }

    // Update form fields with scanned data
    setCardNumber(scannedCardNumber);
    if (scannedPin) {
      setPin(scannedPin);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <main className="w-full max-w-4xl mx-auto -mt-20 py-20">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-black text-black mb-8">
            Gift Balance
          </h1>

          {/* Subheading */}
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed">
            Check your gift card balance by scanning the QR code or entering the code on the back of the card. Enter the code exactly as shown, without spaces or dashes.
          </p>

          {/* Input Section */}
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-start mb-2">
              {/* Card Number Input - 55% width */}
              <div className="w-full md:w-[55%]">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Card Number Here"
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-[#F7C400] focus:outline-none transition-colors text-lg"
                  required
                />
              </div>

              {/* PIN Input - 22% width */}
              <div className="w-full md:w-[22%]">
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="4 digit pin"
                  maxLength={4}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-full focus:border-[#F7C400] focus:outline-none transition-colors text-lg"
                  required
                />
                {/* PIN Note */}
                <p className="text-gray-500 text-xs mt-2 ml-1">
                  *this is your card pin for verification
                </p>
              </div>

              {/* Check Balance Button - 23% width */}
              <div className="w-full md:w-[23%]">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#5c3a3a] hover:bg-[#4a2e2e] text-white font-bold py-4 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-nowrap h-[60px] flex items-center justify-center text-sm md:text-base whitespace-nowrap cursor-pointer"
                >
                  {isLoading ? "Checking..." : "Check Balance"}
                </button>
              </div>
            </div>
          </form>

          {/* QR Code Button */}
          <div className="mt-12">
            <button
              type="button"
              className="px-10 py-4 border-2 border-gray-700 text-gray-800 font-semibold rounded-full hover:bg-gray-50 transition-colors bg-transparent text-center cursor-pointer"
              onClick={() => setIsQRScannerOpen(true)}
            >
              Use camera to scan QR Code behind your card
            </button>
          </div>
        </div>
      </main>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
}
