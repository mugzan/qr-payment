
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

const QrDisplayPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  if (!state || 
      typeof state.qrStringToEncode !== 'string' || 
      typeof state.totalPriceUSD !== 'number' ||
      typeof state.usdtAmountUSD !== 'number' ||
      typeof state.ivyAmountUSD !== 'number' ||
      typeof state.ivyAmountNative !== 'number' ||
      typeof state.imageWasRemovedFromQr !== 'boolean'
     ) {
    React.useEffect(() => {
      console.error("Invalid or incomplete state received for QrDisplayPage, navigating back.", state);
      navigate(-1); 
    }, [navigate, state]);
    
    return (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
                <p className="text-gray-700 mb-4">Could not display QR code. Required data is missing.</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Go to Seller Page
                </button>
            </div>
        </div>
    );
  }

  const { 
    qrStringToEncode, 
    productImageBase64, 
    imageWasRemovedFromQr,
    totalPriceUSD,
    usdtAmountUSD,
    ivyAmountUSD,
    ivyAmountNative 
  } = state;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-95 flex flex-col items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 md:p-10 max-w-md w-full text-center overflow-y-auto max-h-full">
        
        {productImageBase64 && (
          <div className="mb-1 flex flex-col items-center">
            <img 
              src={productImageBase64} 
              alt="Product" 
              className="max-h-40 w-auto object-contain rounded-md border border-gray-200"
            />
            {imageWasRemovedFromQr && (
              <p className="text-xs text-orange-600 mt-1">
                Note: Image shown for reference. Not included in QR due to size.
              </p>
            )}
          </div>
        )}

        <h1 className="text-xl sm:text-2xl font-semibold text-gray-700 mt-3 mb-4">
          Payment QR Code
        </h1>
        
        <div className="p-3 bg-white border-2 border-gray-300 rounded-lg shadow-inner inline-block mb-6">
          <QRCodeCanvas value={qrStringToEncode} size={200} level="L" />
        </div>

        <div className="space-y-2 text-left text-sm sm:text-base mb-6 border-t border-b border-gray-200 py-4">
            <p className="flex justify-between">
                <span className="font-medium text-gray-600">Total Price:</span>
                <span className="font-bold text-gray-800">${totalPriceUSD.toFixed(2)} USD</span>
            </p>
            <p className="flex justify-between">
                <span className="font-medium text-gray-600">USDT Amount:</span>
                <span className="font-bold text-blue-600">${usdtAmountUSD.toFixed(2)} USD</span>
            </p>
            <p className="flex justify-between">
                <span className="font-medium text-gray-600">IVY Token:</span>
                <span className="font-bold text-purple-600">
                    {ivyAmountNative.toLocaleString(undefined, {maximumFractionDigits: 2})} IVY 
                    (${ivyAmountUSD.toFixed(2)} USD)
                </span>
            </p>
        </div>

        <button
          onClick={() => navigate(-1)} 
          className="w-full px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Close QR display and return to form"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default QrDisplayPage;
