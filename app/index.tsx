import { CameraView, useCameraPermissions } from 'expo-camera';
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { removeBackground } from '../lib/backgroundRemover';
import { CATEGORIES, CategoryId } from '../lib/categories';
import { CategoryOverlay } from '../lib/categoryOverlay';
import { CheetahPrintBackground } from '../lib/cheetahPrintBackground';
import { db } from '../lib/db';

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPhoto, setProcessedPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!selectedCategory) {
      Alert.alert('Pick a category first', 'Select what kind of clothing this is before shooting.');
      return;
    }
    if (cameraRef.current) {
      const result = await cameraRef.current.takePictureAsync();
      if (result) {
        setPhoto(result.uri);
        // Start background removal automatically
        setIsProcessing(true);
        try {
          const removedBg = await removeBackground(result.uri);
          setProcessedPhoto(removedBg);
        } catch (error) {
          console.error('Background removal error:', error);
          // Fallback to original photo
          setProcessedPhoto(result.uri);
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  const savePhoto = () => {
    if (!processedPhoto || !selectedCategory) return;

    const sourceFile = new File(processedPhoto);
    const destFile = new File(Paths.document, `clothing_${Date.now()}.png`);
    sourceFile.copy(destFile);

    db.runSync(
      'INSERT INTO clothing_items (uri, category, createdAt) VALUES (?, ?, ?)',
      destFile.uri,
      selectedCategory,
      new Date().toISOString()
    );

    setPhoto(null);
    setProcessedPhoto(null);
    Alert.alert('Saved!', 'Your clothing item has been saved with background removed.');
  };

  // Show processing state while background is being removed
  if (photo && isProcessing) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>Removing background...</Text>
        </View>
      </View>
    );
  }

  // Show preview with background removed
  if (photo && processedPhoto) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: processedPhoto }} style={styles.preview} resizeMode="contain" />
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>✨ Background Removed</Text>
          </View>
        </View>
        <View style={styles.previewButtons}>
          <TouchableOpacity style={styles.button} onPress={() => {
            setPhoto(null);
            setProcessedPhoto(null);
          }}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={savePhoto}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} collapsable={false}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />
      <CategoryOverlay category={selectedCategory} />

      {/* Bottom band: cheetah print from the screen bottom up past the chips */}
      <View style={styles.bottomBand}>
        <CheetahPrintBackground />

        <ScrollView
          horizontal
          style={styles.categoryBar}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 10 }}
          showsHorizontalScrollIndicator={false}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat.id && styles.categoryChipTextSelected,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>

      <View style={styles.galleryButtonWrap}>
        <CheetahPrintBackground />
        <TouchableOpacity style={styles.topButtonFill} onPress={() => router.push('/gallery')}>
          <Text style={styles.topButtonText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fitMakerButtonWrap}>
        <CheetahPrintBackground />
        <TouchableOpacity style={styles.topButtonFill} onPress={() => router.push('/fit-maker')}>
          <Text style={styles.topButtonText}>Fit Maker</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  message: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  camera: { flex: 1 },
  previewContainer: { flex: 1, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  preview: { width: '100%', height: '90%' },
  previewBadge: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  previewBadgeText: { color: '#fff', fontWeight: 'bold' },
  previewButtons: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: '#000' },
  button: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: { fontWeight: 'bold' },
  
  
  
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  
  processingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },

  



  bottomBand: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    overflow: 'hidden',
  },
  categoryBar: {
    position: 'absolute',
    bottom: 115,
    left: 0,
    right: 0,
  },
  categoryChip: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  categoryChipSelected: {
    backgroundColor: '#fff',
  },
  categoryChipText: { color: '#fff', fontWeight: '600' },
  categoryChipTextSelected: { color: '#000' },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#fff' },
  topButtonsWrap: {
    position: 'absolute',
    top: 40,
    right: 15,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
    padding: 8,
    gap: 8,
  },
  topButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  topButtonText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },

  galleryButtonWrap: {
    position: 'absolute',
    top: 40,
    right: 15,
    width: 105,
    height: 40,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 6,
    overflow: 'hidden',
  },
  fitMakerButtonWrap: {
    position: 'absolute',
    top: 88,
    right: 15,
    width: 105,
    height: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  topButtonFill: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});