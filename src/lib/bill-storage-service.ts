import { ScannedBill, ScannedBillItem, Lead } from './types';
import apiClient from './api-client';

export interface BillUploadResult {
  success: boolean;
  billId?: string;
  imageUrl?: string;
  error?: string;
  extractedData?: Partial<ScannedBill>;
}

export interface BillStorageConfig {
  bucketName: string;
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
  imageQuality: number; // 0-1
  maxWidth: number;
  maxHeight: number;
}

export class BillStorageService {
  private config: BillStorageConfig;

  constructor(config?: Partial<BillStorageConfig>) {
    this.config = {
      bucketName: 'bill-scans',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      imageQuality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      ...config
    };
  }

  /**
   * Upload bill image to local storage (simulated)
   */
  async uploadBillImage(file: File, leadId?: string): Promise<BillUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Process image if needed
      const processedFile = await this.processImage(file);

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `bills/${leadId || 'general'}/${timestamp}_${file.name}`;

      // For now, we'll simulate file storage by creating a data URL
      // In a real implementation, you'd upload to a file storage service
      const imageUrl = await this.createDataUrl(processedFile);

      return {
        success: true,
        imageUrl: imageUrl,
        extractedData: {
          scanned_image_url: fileName
        }
      };

    } catch (error) {
      console.error('Error uploading bill image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image'
      };
    }
  }

  /**
   * Save bill data to database via API
   */
  async saveBillData(billData: Partial<ScannedBill>): Promise<BillUploadResult> {
    try {
      if (!billData.bill_number || !billData.items?.length) {
        return {
          success: false,
          error: 'Bill number and items are required'
        };
      }

      // For now, we'll simulate saving to database
      // In a real implementation, you'd call the API
      const mockBillId = 'bill-' + Date.now();

      return {
        success: true,
        billId: mockBillId,
        extractedData: {
          id: mockBillId,
          lead_id: billData.lead_id || '',
          bill_number: billData.bill_number,
          bill_date: billData.bill_date || new Date().toISOString(),
          total_amount: billData.total_amount || 0,
          gst_amount: billData.gst_amount || 0,
          scanned_image_url: billData.scanned_image_url,
          items: billData.items || [],
          created_at: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error saving bill data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save bill data'
      };
    }
  }

  /**
   * Get bill by ID via API
   */
  async getBill(billId: string): Promise<ScannedBill | null> {
    try {
      // For now, return null since we don't have a bills API endpoint yet
      // In a real implementation, you'd call the API
      console.warn('getBill not implemented yet - API endpoint needed');
      return null;

    } catch (error) {
      console.error('Error getting bill:', error);
      return null;
    }
  }

  /**
   * Get bills by lead ID via API
   */
  async getBillsByLead(leadId: string): Promise<ScannedBill[]> {
    try {
      // For now, return empty array since we don't have a bills API endpoint yet
      // In a real implementation, you'd call the API
      console.warn('getBillsByLead not implemented yet - API endpoint needed');
      return [];

    } catch (error) {
      console.error('Error getting bills by lead:', error);
      return [];
    }
  }

  /**
   * Delete bill and associated image via API
   */
  async deleteBill(billId: string): Promise<boolean> {
    try {
      // For now, return true since we don't have a bills API endpoint yet
      // In a real implementation, you'd call the API
      console.warn('deleteBill not implemented yet - API endpoint needed');
      return true;

    } catch (error) {
      console.error('Error deleting bill:', error);
      return false;
    }
  }

  /**
   * Get image URL from storage
   */
  getImageUrl(imagePath: string): string {
    // For now, return the path as is
    // In a real implementation, you'd construct the proper URL
    return imagePath;
  }

  /**
   * Download image as blob
   */
  async downloadImage(imagePath: string): Promise<Blob | null> {
    try {
      // For now, we'll return null since we're not actually storing files
      // In a real implementation, you'd fetch the file from storage
      console.warn('File download not implemented in API version');
      return null;

    } catch (error) {
      console.error('Error downloading image:', error);
      return null;
    }
  }

  /**
   * Create data URL from file
   */
  private async createDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum limit of ${this.config.maxFileSize / (1024 * 1024)}MB`
      };
    }

    // Check file type
    if (!this.config.allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Process image for optimal storage
   */
  private async processImage(file: File): Promise<File> {
    // If it's not an image, return as is
    if (!file.type.startsWith('image/')) {
      return file;
    }

    try {
      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return file;
      }

      // Load image
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > this.config.maxWidth || height > this.config.maxHeight) {
            const ratio = Math.min(
              this.config.maxWidth / width,
              this.config.maxHeight / height
            );
            width *= ratio;
            height *= ratio;
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const processedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: file.lastModified
                });
                resolve(processedFile);
              } else {
                resolve(file);
              }
              URL.revokeObjectURL(imageUrl);
            },
            file.type,
            this.config.imageQuality
          );
        };

        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          resolve(file);
        };

        img.src = imageUrl;
      });

    } catch (error) {
      console.warn('Failed to process image, using original:', error);
      return file;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    bucketName: string;
  }> {
    try {
      // For now, return mock stats since we're not actually storing files
      // In a real implementation, you'd query your file storage service
      return {
        totalFiles: 0,
        totalSize: 0,
        bucketName: this.config.bucketName
      };

    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        bucketName: this.config.bucketName
      };
    }
  }
}

export const billStorageService = new BillStorageService(); 