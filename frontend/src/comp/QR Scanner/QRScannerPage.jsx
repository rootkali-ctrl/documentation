import React, { useState, useEffect, useRef } from "react";
import { Camera, AlertCircle, Smartphone, CheckCircle, X } from "lucide-react";
import { useMediaQuery } from "@mui/material";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { db } from "../../firebase/firebase_config"
import { doc, getDoc } from "firebase/firestore";

const QRScannerPage = () => {
  const { vendorId } = useParams();
  const isMobileScreen = useMediaQuery("(max-width:768px)");
  const [showMobilePopup, setShowMobilePopup] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', 'mismatch'
  const [error, setError] = useState("");
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  // Initialize QR Scanner on mobile
  useEffect(() => {
    if (isMobileScreen && !scannerRef.current && !scanResult) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isMobileScreen, scanResult]);

  const initializeScanner = () => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    const scanner = new Html5QrcodeScanner("qr-scanner", config, false);
    scannerRef.current = scanner;

    scanner.render(onScanSuccess, onScanFailure);
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log("Raw QR Code scanned:", decodedText);
    
    // Clean the scanned text (remove # and trim)
    const cleanedText = decodedText.replace(/^#+|#+$/g, '').trim();
    console.log("Cleaned QR text:", cleanedText);
    
    setScanResult(cleanedText);
    
    // Try to parse the data
    let parsedData;
    try {
      // Try to parse as JSON first
      parsedData = JSON.parse(cleanedText);
      console.log("Parsed as JSON:", parsedData);
    } catch (error) {
      // If not JSON, treat as booking ID
      parsedData = { bookingId: cleanedText };
      console.log("Treated as booking ID:", parsedData);
    }
    
    setScannedData(parsedData);
    
    // Stop the scanner
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
  };

  const onScanFailure = (error) => {
    // Handle scan failure silently - this fires frequently during scanning
    console.error("QR scan failed:", error);
  };

  const resetScanner = () => {
    setScanResult(null);
    setScannedData(null);
    setIsVerifying(false);
    setVerificationStatus(null);
    setError("");
    if (isMobileScreen) {
      initializeScanner();
    }
  };

  const proceedWithBooking = async () => {
    if (!scannedData || !scannedData.bookingId) {
      setError("No booking ID found");
      return;
    }

    try {
      setIsVerifying(true);
      setError("");
      setVerificationStatus(null);

      const bookingId = scannedData.bookingId;
      console.log("Verifying booking ID:", bookingId);
      console.log("Expected vendor ID:", vendorId);

      // Get ticket document from Firestore
      const ticketRef = doc(db, "tickets", bookingId);
      const ticketSnap = await getDoc(ticketRef);

      if (!ticketSnap.exists()) {
        throw new Error("Ticket not found in database");
      }

      const ticketData = ticketSnap.data();
      const firestoreVendorId = ticketData.vendorId;

      console.log("Firestore vendor ID:", firestoreVendorId);
      console.log("URL vendor ID:", vendorId);

      // Check if vendor IDs match
      if (firestoreVendorId === vendorId) {
        setVerificationStatus('success');
        navigate(`/vendor/${vendorId}/booking/${bookingId}`)
        
        // Wait a moment to show success, then navigate
        setTimeout(() => {
          navigate(`/vendor/${vendorId}/booking/${bookingId}`);
        }, 2000);
        
      } else {
        setVerificationStatus('mismatch');
        setError(`This ticket belongs to a different venue. Expected: ${vendorId}, Found: ${firestoreVendorId}`);
      }

    } catch (error) {
      console.error("Firestore verification error:", error);
      setVerificationStatus('error');
      setError(error.message || "Failed to verify ticket. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const openScannerOnDesktop = () => {
    setShowMobilePopup(true);
  };

  const closeMobilePopup = () => {
    setShowMobilePopup(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile Popup */}
      {showMobilePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <Smartphone className="mx-auto mb-4 text-blue-500" size={64} />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Mobile Device Required
            </h2>
            <p className="text-gray-600 mb-6">
              QR Code scanner is only available on mobile devices. Please access this page from your smartphone or tablet.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> Open this link on your mobile device to use the scanner.
              </p>
            </div>
            <button
              onClick={closeMobilePopup}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">QR Scanner</h1>
          <div className="flex items-center text-sm text-gray-600">
            <Camera size={16} className="mr-1" />
            Scanner
          </div>
        </div>
      </div>

      {/* Scanner Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 w-full max-w-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="text-red-500 mr-2" size={20} />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {!isMobileScreen ? (
          <div className="text-center text-white px-4">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md">
              <Camera size={64} className="mx-auto mb-4 text-blue-400" />
              <h2 className="text-xl font-bold mb-4">QR Code Scanner</h2>
              <p className="text-gray-300 mb-6">
                This scanner is only available on mobile devices.
              </p>
              <button
                onClick={openScannerOnDesktop}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg"
              >
                Open QR Scanner
              </button>
            </div>
          </div>
        ) : (
          <>
            {!scanResult ? (
              <div className="w-full max-w-sm mb-6">
                <div id="qr-scanner" className="rounded-lg overflow-hidden"></div>
                
                {/* Manual start button */}
                <div className="text-center mt-4">
                  <button
                    onClick={initializeScanner}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Start Camera
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-sm mb-6">
                <div className="bg-gray-800 rounded-lg p-6 text-center text-white">
                  <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
                  <h3 className="text-lg font-semibold mb-4">QR Code Scanned!</h3>
                  
                  {/* Display scanned data */}
                  <div className="bg-gray-700 rounded-lg p-4 mb-4 text-left">
                    <h4 className="font-semibold mb-2">Scanned Data:</h4>
                    <div className="text-sm">
                      <div className="mb-2">
                        <span className="text-gray-300">Raw Data:</span>
                        <div className="bg-gray-600 p-2 rounded mt-1 break-all">
                          {scanResult}
                        </div>
                      </div>
                      
                      {scannedData && (
                        <div>
                          <span className="text-gray-300">Parsed Data:</span>
                          <div className="bg-gray-600 p-2 rounded mt-1">
                            {Object.entries(scannedData).map(([key, value]) => (
                              <div key={key} className="mb-1">
                                <span className="text-blue-300">{key}:</span> {value}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={proceedWithBooking}
                      className="bg-green-500 text-white px-6 py-2 rounded text-sm w-full disabled:bg-gray-500 disabled:cursor-not-allowed"
                      disabled={!scannedData?.bookingId || isVerifying}
                    >
                      {isVerifying ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Verifying...
                        </div>
                      ) : (
                        "Proceed with Booking"
                      )}
                    </button>
                    
                    {/* Status Display */}
                    {verificationStatus === 'success' && (
                      <div className="bg-green-500 text-white px-4 py-2 rounded text-sm flex items-center">
                        <CheckCircle size={16} className="mr-2" />
                        Verified! Redirecting...
                      </div>
                    )}
                    
                    {verificationStatus === 'mismatch' && (
                      <div className="bg-orange-500 text-white px-4 py-2 rounded text-sm flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        Venue Mismatch
                      </div>
                    )}
                    
                    {verificationStatus === 'error' && (
                      <div className="bg-red-500 text-white px-4 py-2 rounded text-sm flex items-center">
                        <X size={16} className="mr-2" />
                        Verification Failed
                      </div>
                    )}
                    
                    <button
                      onClick={resetScanner}
                      className="bg-blue-500 text-white px-6 py-2 rounded text-sm w-full"
                      disabled={isVerifying}
                    >
                      Scan Another QR Code
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center text-white px-4">
              {!scanResult && (
                <>
                  <h2 className="text-lg font-semibold mb-2">Scan QR Code</h2>
                  <p className="text-gray-300 text-sm mb-4">
                    Point your camera at the QR code on the ticket to scan it.
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white p-4 text-center">
        <p className="text-xs text-gray-500">
          Vendor ID: {vendorId || "Not available"}
        </p>
      </div>
    </div>
  );
};

export default QRScannerPage;