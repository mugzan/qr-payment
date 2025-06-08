
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { ProductQRCodeData } from '../types'; // This import is fine

const QR_READER_ELEMENT_ID = "qr-reader-buyer";

const BuyerPage = () => { // Removed React.FC
  const [scannedData, setScannedData] = useState(null); // Removed <ProductQRCodeData | null>
  const [quantity, setQuantity] = useState(1); // Removed <number>
  const [scanError, setScanError] = useState(null); // Removed <string | null>
  const [isScanning, setIsScanning] = useState(false); // Removed <boolean>
  
  const html5QrCodeRef = useRef(null); // Removed <Html5Qrcode | null>

  const stopScanner = useCallback(() => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
      html5QrCodeRef.current.stop()
        .then(() => {
          // console.log("QR Scanner stopped successfully.");
        })
        .catch(err => {
          console.error("Failed to stop QR scanner.", err);
        })
        .finally(() => {
            setIsScanning(false);
            const scannerElement = document.getElementById(QR_READER_ELEMENT_ID);
            if (scannerElement) {
                scannerElement.innerHTML = '';
            }
        });
    } else {
        setIsScanning(false); 
    }
  }, []); 

  const startScanner = useCallback(() => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
        console.log("Scanner already running.");
        return;
    }

    setScanError(null);
    setScannedData(null); 
    setIsScanning(true);

    const qrCodeSuccessCallback = (decodedText) => { // Removed decodedText: string
      try {
        const parsedData = JSON.parse(decodedText); // Removed : ProductQRCodeData
        if (parsedData && typeof parsedData.totalPriceUSD === 'number' && typeof parsedData.usdtAmountUSD === 'number' && typeof parsedData.ivyAmountUSD === 'number') { 
          setScannedData(parsedData);
          setScanError(null);
          setQuantity(1); 
        } else {
          throw new Error("Invalid QR code data structure.");
        }
      } catch (error) {
        console.error("Failed to parse QR code data:", error);
        setScanError("Invalid or unreadable QR code data. Please scan a valid product QR code.");
        setScannedData(null);
      } finally {
        stopScanner();
      }
    };

    const qrCodeErrorCallback = (errorMessage) => { // Removed errorMessage: string
        console.warn(`QR Code scan error reported by library: ${errorMessage}`);
    };
    
    const qrReaderElement = document.getElementById(QR_READER_ELEMENT_ID);
    if (!qrReaderElement) {
        setScanError("QR Reader element not found in DOM. Cannot start scanner.");
        setIsScanning(false);
        return;
    }

    if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(QR_READER_ELEMENT_ID, {verbose: false});
    }

    const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
    
    html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
    ).catch(err => {
        console.error("Unable to start QR scanner.", err);
        setScanError(`Failed to start camera/scanner: ${err.message}. Please ensure camera permissions are granted.`);
        setIsScanning(false);
    });
  }, [stopScanner]);

  useEffect(() => {
    const currentQrCodeInstance = html5QrCodeRef.current;
    return () => {
      if (currentQrCodeInstance && currentQrCodeInstance.getState() === Html5QrcodeScannerState.SCANNING) {
         currentQrCodeInstance.stop()
            .then(() => { /* console.log("Scanner stopped on unmount."); */ })
            .catch(err => { console.error("Error stopping scanner on unmount:", err); });
      }
    };
  }, []);

  const handleQuantityChange = (event) => { // Removed event: React.ChangeEvent<HTMLInputElement>
    const val = parseInt(event.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setQuantity(val);
    } else if (event.target.value === '') {
        setQuantity(1); 
    }
  };

  const totalPurchasePrice = scannedData ? scannedData.totalPriceUSD * quantity : 0;
  const totalUsdtAmount = scannedData ? scannedData.usdtAmountUSD * quantity : 0;
  const totalIvyAmount = scannedData ? scannedData.ivyAmountUSD * quantity : 0; 

  const handleScanNew = () => {
    setScannedData(null);
    setScanError(null);
    setQuantity(1);
    startScanner();
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Buyer Area</h1>

      {!isScanning && !scannedData && (
        <button
          onClick={startScanner}
          className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mb-6"
          aria-label="Scan Product QR Code"
        >
          Scan Product QR Code
        </button>
      )}
      
      {isScanning && (
        <div className="mb-6">
          <div id={QR_READER_ELEMENT_ID} className="w-full max-w-md mx-auto aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden" aria-live="polite">
            {/* Scanner will render here. Content will be announced by screen readers if changes occur. */}
          </div>
          <button
            onClick={stopScanner}
            className="mt-4 w-full flex justify-center items-center px-6 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Cancel Scan"
          >
            Cancel Scan
          </button>
        </div>
      )}

      {scanError && <div role="alert" className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{scanError}</div>}

      {scannedData && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-700">Product Details</h2>
          {scannedData.productImageBase64 && (
            <div className="flex justify-center my-4">
                <img 
                    src={scannedData.productImageBase64} 
                    alt={scannedData.productName || 'Product Image'} 
                    className="max-h-60 w-auto object-contain rounded-lg border border-gray-200 shadow-sm"
                />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div>
                <p className="text-sm text-gray-500">Price per Item (USD)</p>
                <p className="text-xl font-semibold text-gray-800">${scannedData.totalPriceUSD.toFixed(2)}</p>
            </div>
             <div>
                <p className="text-sm text-gray-500">USDT / Item</p>
                <p className="text-lg font-medium text-blue-600">${scannedData.usdtAmountUSD.toFixed(2)}</p>
            </div>
             <div>
                <p className="text-sm text-gray-500">IVY Token / Item</p> 
                <p className="text-lg font-medium text-purple-600">${scannedData.ivyAmountUSD.toFixed(2)}</p> 
            </div>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
              className="mt-1 block w-full max-w-xs px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              aria-label="Product quantity"
            />
          </div>

          <div className="p-4 border-t border-gray-200 mt-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Total Purchase</h3>
            <div className="space-y-2 text-lg">
                <p className="flex justify-between">
                    <span className="text-gray-600">Total USDT:</span> 
                    <span className="font-bold text-blue-700">${totalUsdtAmount.toFixed(2)}</span>
                </p>
                <p className="flex justify-between">
                    <span className="text-gray-600">Total IVY Token:</span> 
                    <span className="font-bold text-purple-700">${totalIvyAmount.toFixed(2)}</span> 
                </p>
                 <hr className="my-2"/>
                <p className="flex justify-between text-xl">
                    <span className="font-semibold text-gray-800">Total Price (USD):</span> 
                    <span className="font-bold text-green-600">${totalPurchasePrice.toFixed(2)}</span>
                </p>
            </div>
          </div>
          
          <button
            onClick={handleScanNew}
            className="mt-6 w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Scan Another Product"
          >
            Scan Another Product
          </button>
        </div>
      )}
    </div>
  );
};

export default BuyerPage;