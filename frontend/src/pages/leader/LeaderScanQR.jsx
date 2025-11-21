import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import API from "../../api";

export default function LeaderScanQR() {
  const navigate = useNavigate();
  const [qrInput, setQrInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState("camera"); // "camera" or "manual"
  const [scannerActive, setScannerActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scannerRef = useRef(null);
  const scannerIdRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scanMode === "camera" && !scannerActive) {
      startScanner();
    } else if (scanMode === "manual" && scannerActive) {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [scanMode]);

  const startScanner = () => {
    if (scannerIdRef.current) return; // Already started

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        qrbox: { width: 250, height: 250 },
        fps: 5,
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        // QR code scanned successfully
        setQrInput(decodedText);
        stopScanner();
        handleCheckIn(decodedText);
      },
      (errorMessage) => {
        // Ignore scanning errors (they're frequent while scanning)
      }
    );

    scannerRef.current = scanner;
    setScannerActive(true);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch((err) => {
        console.error("Error stopping scanner:", err);
      });
      scannerRef.current = null;
      scannerIdRef.current = null;
      setScannerActive(false);
    }
  };

  const extractRegistrationId = (qrData) => {
    // QR code format: REG:123|EVT:456|NAME:...|EMAIL:...
    const match = qrData.match(/REG:(\d+)/);
    if (match) return match[1];
    // If it's just a number, use it directly
    if (/^\d+$/.test(qrData.trim())) return qrData.trim();
    return null;
  };

  const handleCheckIn = async (qrData = null) => {
    const dataToProcess = qrData || qrInput.trim();

    if (!dataToProcess) {
      setResult({ type: "error", message: "Please enter or scan a QR code" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const registrationId = extractRegistrationId(dataToProcess);

      if (!registrationId) {
        setResult({
          type: "error",
          message:
            "Invalid QR code format. Please scan the QR code again or enter the registration ID.",
        });
        setLoading(false);
        return;
      }

      const res = await API.post(`/api/leader/check-in/${registrationId}`);

      setResult({
        type: "success",
        message: res.data.message,
        participant: res.data.participant,
        email: res.data.email,
        event: res.data.event,
      });

      // Clear input after successful check-in
      setQrInput("");
      if (inputRef.current) inputRef.current.focus();

      // Restart scanner if in camera mode
      if (scanMode === "camera") {
        setTimeout(() => {
          startScanner();
        }, 2000);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Check-in failed. Please try again.";

      setResult({
        type: "error",
        message: errorMsg,
      });

      // Restart scanner if in camera mode
      if (scanMode === "camera") {
        setTimeout(() => {
          startScanner();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCheckIn();
    }
  };

  const switchMode = (mode) => {
    if (mode === scanMode) return;
    stopScanner();
    setScanMode(mode);
    setQrInput("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
        
        .initial-hidden {
          opacity: 0;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(229, 231, 235, 0.3);
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
        }
        
        .professional-card {
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
          position: relative;
          overflow: hidden;
        }
        
        .professional-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
        }
        
        .innovative-border {
          border: none;
          border-left: 4px solid #16a34a;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .minimal-rounded {
          border-radius: 8px;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className={`mb-8 ${mounted ? 'animate-fadeInUp' : 'initial-hidden'}`}>
          <button
            onClick={() => {
              stopScanner();
              navigate("/leader");
            }}
            className="mb-6 text-green-600 hover:text-green-700 font-semibold flex items-center gap-2 transition-all duration-300 hover:gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            QR Check-In
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Verify attendees with instant QR scanning or manual entry
          </p>
        </div>

        {/* Mode Toggle */}
        <div className={`mb-6 flex gap-3 ${mounted ? 'animate-fadeIn delay-100' : 'initial-hidden'}`}>
          <button
            onClick={() => switchMode("camera")}
            className={`flex-1 py-4 px-6 minimal-rounded font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 ${
              scanMode === "camera"
                ? "bg-green-600 text-white shadow-md border border-green-700"
                : "glass-effect text-gray-700 hover:bg-white shadow-sm border border-gray-200"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Camera Scan
          </button>
          <button
            onClick={() => switchMode("manual")}
            className={`flex-1 py-4 px-6 minimal-rounded font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 ${
              scanMode === "manual"
                ? "bg-green-600 text-white shadow-md border border-green-700"
                : "glass-effect text-gray-700 hover:bg-white shadow-sm border border-gray-200"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Manual Entry
          </button>
        </div>

        {/* Main Scanner/Input Area */}
        <div className={`professional-card minimal-rounded p-8 mb-8 ${mounted ? 'animate-scaleIn delay-200' : 'initial-hidden'}`}>
          {scanMode === "camera" ? (
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Camera Scanner
              </label>
              <div
                id="qr-reader"
                className="border-4 border-green-200 rounded-2xl overflow-hidden shadow-inner"
              ></div>
              <p className="text-sm text-gray-600 mt-4 bg-green-50 p-3 minimal-rounded border-l-4 border-green-600 border border-green-200">
                💡 Point your camera at the QR code. Make sure you grant camera permissions.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                QR Code / Registration ID
              </label>
              <input
                ref={inputRef}
                type="text"
                className="w-full p-5 border border-gray-300 minimal-rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg transition-all duration-300 bg-white"
                placeholder="Paste registration ID (e.g., REG:123|EVT:456|...) or just the number"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
              <p className="text-sm text-gray-600 mt-4 bg-green-50 p-3 minimal-rounded border-l-4 border-green-600 border border-green-200">
                💡 You can paste the full QR code data or just enter the registration ID number
              </p>
            </div>
          )}

          {scanMode === "manual" && (
            <button
              onClick={() => handleCheckIn()}
              disabled={loading || !qrInput.trim()}
              className={`w-full mt-6 py-5 minimal-rounded font-bold text-white text-lg transition-all duration-300 shadow-md transform hover:scale-105 active:scale-95 ${
                loading || !qrInput.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 hover:shadow-lg"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : "✓ Verify & Check In"}
            </button>
          )}

          {/* Result Display */}
          {result && (
            <div
              className={`mt-6 p-6 minimal-rounded border-l-4 animate-fadeIn ${
                result.type === "success"
                  ? "bg-green-50 border-green-600 border border-green-200"
                  : "bg-red-50 border-red-600 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {result.type === "success" ? (
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="h-7 w-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <svg
                        className="h-7 w-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-lg font-bold mb-2 ${
                      result.type === "success"
                        ? "text-green-900"
                        : "text-red-900"
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.type === "success" && result.participant && (
                    <div className="space-y-2 text-gray-700">
                      <div className="flex items-center gap-2 bg-white p-3 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-semibold">Participant:</span>
                        <span className="font-bold text-green-700">{result.participant}</span>
                      </div>
                      {result.email && (
                        <div className="flex items-center gap-2 bg-white p-3 rounded-lg">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="font-semibold">Email:</span>
                          <span className="text-green-700">{result.email}</span>
                        </div>
                      )}
                      {result.event && (
                        <div className="flex items-center gap-2 bg-white p-3 rounded-lg">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-semibold">Event:</span>
                          <span className="text-green-700">{result.event}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-effect rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
            <h3 className="font-bold text-green-900 mb-4 text-lg flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to Get Registration ID
            </h3>
            <ul className="text-sm text-green-800 space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">📷</span>
                <span><strong>Camera Scan:</strong> Automatically read QR codes from participant phones</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">📱</span>
                <span><strong>From QR Code:</strong> Format: <code className="bg-green-100 px-2 py-1 rounded">REG:123|EVT:456|...</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">💻</span>
                <span><strong>From Dashboard:</strong> Participants see ID below QR code (clickable to copy)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">⌨️</span>
                <span><strong>Manual Entry:</strong> Enter just the number (e.g., <code className="bg-blue-100 px-2 py-1 rounded">123</code>)</span>
              </li>
            </ul>
          </div>

          <div className="glass-effect rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
            <h3 className="font-bold text-green-900 mb-4 text-lg flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How It Works
            </h3>
            <ul className="text-sm text-green-800 space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">1.</span>
                <span>Participants receive QR code when they RSVP</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">2.</span>
                <span>Scan QR code or manually enter registration ID</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">3.</span>
                <span>System verifies and marks attendance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">4.</span>
                <span>Prevents duplicate check-ins automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">5.</span>
                <span>Camera scanner auto-restarts after each check-in</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
