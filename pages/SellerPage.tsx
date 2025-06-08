
import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react'; // Keep for potential future use or small previews, but not primary display
import { ProductQRCodeData } from '../types';

// Placeholder: 1 IVY Token = $0.50 USD.
const USD_PER_IVY_TOKEN = 0.5;

// Max length for the base64 image string itself.
const SOFT_MAX_BASE64_IMAGE_LENGTH = 1800; 
// Max length for the total JSON stringified QR data.
const MAX_QR_STRING_LENGTH = 2800;   
// Max file size for product image upload in bytes (e.g., 500KB)
const MAX_PRODUCT_IMAGE_FILE_SIZE_BYTES = 500 * 1024; // 500KB


const SellerPage: React.FC = () => {
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreviewUrl, setProductImagePreviewUrl] = useState<string | null>(null);
  const [totalPriceUSD, setTotalPriceUSD] = useState<string>('');
  const [usdtAmountUSD, setUsdtAmountUSD] = useState<string>('');
  const [qrCodeValueInternal, setQrCodeValueInternal] = useState<string>(''); // Renamed, not for direct large display
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!productImageFile) {
      setProductImagePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(productImageFile);
    setProductImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [productImageFile]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (file.size > MAX_PRODUCT_IMAGE_FILE_SIZE_BYTES) {
        setErrorMessage(`Error: Image file too large. Max ${MAX_PRODUCT_IMAGE_FILE_SIZE_BYTES / 1024}KB allowed. Please choose a smaller image.`);
        setProductImageFile(null);
        setProductImagePreviewUrl(null);
        event.target.value = ''; // Reset file input
        return;
      }
      setProductImageFile(file);
      setQrCodeValueInternal(''); 
      setErrorMessage(''); 
    } else {
        // If no file is selected (e.g., user cancels selection), clear existing
        setProductImageFile(null);
        setProductImagePreviewUrl(null);
    }
  };

  const handleUsdtAmountChange = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value) && value !== '') return;

    const currentTotal = parseFloat(totalPriceUSD);
    const currentUsdt = parseFloat(value);
    let errorMsg = '';

    if (!isNaN(currentTotal) && currentTotal > 0 && !isNaN(currentUsdt)) {
      if (currentUsdt > currentTotal * 0.5) {
        setUsdtAmountUSD((currentTotal * 0.5).toFixed(2));
        errorMsg = 'USDT amount cannot exceed 50% of total price. Adjusted automatically.';
      } else {
        setUsdtAmountUSD(value);
      }
    } else {
      setUsdtAmountUSD(value);
      if (value !== '' && currentTotal <=0 && !isNaN(currentUsdt) && currentUsdt > 0) {
         errorMsg = 'Please set a valid Total Price first.';
      }
    }
    setErrorMessage(errorMsg);
    setQrCodeValueInternal('');
  };
  
  const handleTotalPriceChange = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value) && value !== '') return;
    
    setTotalPriceUSD(value);
    const newTotal = parseFloat(value);
    const currentUsdt = parseFloat(usdtAmountUSD);
    let errorMsg = '';

    if (!isNaN(newTotal) && newTotal > 0 && !isNaN(currentUsdt)) {
      if (currentUsdt > newTotal * 0.5) {
        setUsdtAmountUSD((newTotal * 0.5).toFixed(2));
        errorMsg = 'USDT amount adjusted as Total Price changed.';
      }
    } else if (newTotal <= 0 && currentUsdt > 0) {
        setUsdtAmountUSD(''); 
        errorMsg = 'Total price must be greater than zero.';
    }
    setErrorMessage(errorMsg);
    setQrCodeValueInternal('');
  };


  const numTotalPrice = parseFloat(totalPriceUSD);
  const numUsdtAmount = parseFloat(usdtAmountUSD);
  const numIvyAmountUSD = !isNaN(numTotalPrice) && !isNaN(numUsdtAmount) && numTotalPrice >= numUsdtAmount ? numTotalPrice - numUsdtAmount : 0;
  const numIvyAmountNative = USD_PER_IVY_TOKEN > 0 ? numIvyAmountUSD / USD_PER_IVY_TOKEN : 0;


  const convertImageToBase64 = (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      }
      reader.onerror = (error) => reject(error);
    });
  };

  const generateQrCode = async () => {
    let genErrorMessage = ''; 

    if (isNaN(numTotalPrice) || numTotalPrice <= 0) {
      genErrorMessage = 'Please enter a valid total price.';
    } else if (isNaN(numUsdtAmount) || numUsdtAmount < 0) {
      genErrorMessage = 'Please enter a valid USDT amount.';
    } else if (numUsdtAmount > numTotalPrice * 0.5) {
      genErrorMessage = 'USDT amount cannot exceed 50% of total price.';
    } else if (numIvyAmountUSD < 0) { 
        genErrorMessage = 'Calculation error. IVY Token amount is negative.';
    } else if (numTotalPrice > 0 && numIvyAmountUSD < numTotalPrice * 0.5) {
        // Allow for tiny floating point discrepancies
        if (numIvyAmountUSD < (numTotalPrice * 0.5) - 0.001) {
             genErrorMessage = 'IVY Token amount (USD) must be at least 50% of Total Price. Please adjust USDT amount.';
        }
    }

    if (genErrorMessage) {
      setErrorMessage(genErrorMessage);
      setIsLoading(false);
      setQrCodeValueInternal('');
      return;
    }

    setIsLoading(true);
    setQrCodeValueInternal(''); 
    setErrorMessage(''); 

    let imageBase64: string | null = null;
    if (productImageFile) {
      try {
        imageBase64 = await convertImageToBase64(productImageFile);
        if (imageBase64 && imageBase64.length > SOFT_MAX_BASE64_IMAGE_LENGTH) {
          genErrorMessage = `Warning: Image data is large (${(imageBase64.length / 1024).toFixed(1)}KB). This may affect QR code scannability or prevent generation if total data is too large. `;
        }
      } catch (error) {
        setErrorMessage('Error processing image. Please try another image or proceed without one.');
        setIsLoading(false);
        return;
      }
    }

    const qrDataForEncoding: ProductQRCodeData = {
      productImageBase64: imageBase64,
      productName: '', 
      totalPriceUSD: numTotalPrice,
      usdtAmountUSD: numUsdtAmount,
      ivyAmountUSD: numIvyAmountUSD,
    };
    
    let finalQrStringToEncode = JSON.stringify(qrDataForEncoding);
    let imageWasRemovedFromQr = false;

    if (finalQrStringToEncode.length > MAX_QR_STRING_LENGTH) {
      if (imageBase64) { 
        const qrDataWithoutImage: ProductQRCodeData = { ...qrDataForEncoding, productImageBase64: null };
        finalQrStringToEncode = JSON.stringify(qrDataWithoutImage);
        imageWasRemovedFromQr = true; 

        if (finalQrStringToEncode.length > MAX_QR_STRING_LENGTH) {
          genErrorMessage += `Error: Product data is too large for QR code (even without image - ${finalQrStringToEncode.length} chars). Max ${MAX_QR_STRING_LENGTH} chars.`;
          setQrCodeValueInternal(''); 
          setErrorMessage(genErrorMessage.trim());
          setIsLoading(false);
          return;
        } else {
          genErrorMessage += `Image was too large and has been removed for QR encoding. (Total data ${finalQrStringToEncode.length} chars). The image will still be shown on the next screen for reference.`;
        }
      } else {
        genErrorMessage += `Error: Product data is too large for QR code (${finalQrStringToEncode.length} chars). Max ${MAX_QR_STRING_LENGTH} chars.`;
        setQrCodeValueInternal(''); 
        setErrorMessage(genErrorMessage.trim());
        setIsLoading(false);
        return; 
      }
    }
    
    setQrCodeValueInternal(finalQrStringToEncode); 
    setErrorMessage(genErrorMessage.trim()); 
    setIsLoading(false);

    navigate('/qr-display', { 
      state: { 
        qrStringToEncode: finalQrStringToEncode,
        productImageBase64: imageBase64, // Pass the original image for display
        imageWasRemovedFromQr: imageWasRemovedFromQr, // Flag indicating if it's in the QR string
        totalPriceUSD: numTotalPrice,
        usdtAmountUSD: numUsdtAmount,
        ivyAmountUSD: numIvyAmountUSD,
        ivyAmountNative: numIvyAmountNative
      } 
    });
  };
  
  const resetForm = () => {
    setProductImageFile(null);
    setProductImagePreviewUrl(null);
    setTotalPriceUSD('');
    setUsdtAmountUSD('');
    setQrCodeValueInternal('');
    setErrorMessage('');
    setIsLoading(false);
    const fileInput = document.getElementById('fileUploadInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    const cameraInput = document.getElementById('cameraUploadInput') as HTMLInputElement;
    if (cameraInput) cameraInput.value = '';
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Seller Dashboard</h1>

      {errorMessage && (
        <div className={`mb-4 p-3 rounded-md text-sm ${errorMessage.toLowerCase().startsWith('error:') ? 'bg-red-100 text-red-700' : errorMessage.toLowerCase().startsWith('warning:') ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
            {errorMessage}
        </div>
      )}
      
      <div className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Image (Max {MAX_PRODUCT_IMAGE_FILE_SIZE_BYTES / 1024}KB)</label>
          <div className="mt-1 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <input 
              id="fileUploadInput"
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              aria-label="Upload product image"
            />
            <input 
              id="cameraUploadInput"
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              aria-label="Capture image with camera"
            />
          </div>
          {productImagePreviewUrl && (
            <div className="mt-4 border border-gray-300 rounded-md p-2 inline-block">
              <img src={productImagePreviewUrl} alt="Product Preview" className="h-32 w-32 object-cover rounded"/>
              <p className="text-xs text-gray-500 mt-1 text-center">Preview</p>
            </div>
          )}
        </div>

        {/* Price Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="totalPrice" className="block text-sm font-medium text-gray-700">Total Price (USD)</label>
            <input
              type="text"
              id="totalPrice"
              value={totalPriceUSD}
              onChange={(e) => handleTotalPriceChange(e.target.value)}
              placeholder="e.g., 100"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="usdtAmount" className="block text-sm font-medium text-gray-700">USDT Amount (USD)</label>
            <input
              type="text"
              id="usdtAmount"
              value={usdtAmountUSD}
              onChange={(e) => handleUsdtAmountChange(e.target.value)}
              placeholder="e.g., 40 (max 50% of total)"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        
        {!isNaN(numIvyAmountUSD) && numTotalPrice > 0 && (
          <div className="p-3 bg-indigo-50 rounded-md">
            <p className="text-sm font-medium text-indigo-700">
              ivy token amount(usd) : 
              <span className="font-bold text-lg ml-2">
                {numIvyAmountNative.toLocaleString(undefined, {maximumFractionDigits: 2})} IVY 
                (${numIvyAmountUSD.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})})
              </span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
                (Using placeholder rate: 1 IVY = ${USD_PER_IVY_TOKEN.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} USD)
            </p>
            {(numTotalPrice > 0 && numIvyAmountUSD < (numTotalPrice * 0.5) - 0.001) && 
              <p className="text-xs text-red-500 mt-1">IVY Token (USD value) must be at least 50% of Total Price. Please adjust USDT.</p>
            }
          </div>
        )}

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
          <button
            onClick={generateQrCode}
            disabled={
                isLoading || 
                isNaN(numTotalPrice) || numTotalPrice <= 0 || 
                isNaN(numUsdtAmount) || numUsdtAmount < 0 || 
                (numTotalPrice > 0 && (numIvyAmountUSD < (numTotalPrice * 0.5) - 0.001)) 
            }
            className="w-full sm:w-auto flex-1 justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Generate & Display QR Code"}
          </button>
           <button
            onClick={resetForm}
            className="w-full sm:w-auto flex-1 justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Reset Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerPage;
