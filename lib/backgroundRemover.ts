import { removeBgImage } from 'rn-remove-image-bg';

export async function removeBackground(imageUri: string): Promise<string> {
  try {
    console.log('🧹 Starting background removal...');
    
    const processedUri = await removeBgImage(imageUri, {
      maxDimension: 1024, // Good balance of quality and performance
      format: 'PNG',      // PNG supports transparency
    });
    
    console.log('✅ Background removed!');
    return processedUri;
  } catch (error) {
    console.error('❌ Background removal failed:', error);
    // Return the original image if removal fails
    return imageUri;
  }
}