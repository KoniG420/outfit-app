import { CameraView, useCameraPermissions } from 'expo-camera';
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CATEGORIES, CategoryId } from '../../lib/categories';
import { CategoryOverlay } from '../../lib/CategoryOverlay';
import { db } from '../../lib/db';

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
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
      if (result) setPhoto(result.uri);
    }
  };

  const savePhoto = () => {
    if (!photo || !selectedCategory) return;

    const sourceFile = new File(photo);
    const destFile = new File(Paths.document, `clothing_${Date.now()}.jpg`);
    sourceFile.copy(destFile);

    db.runSync(
      'INSERT INTO clothing_items (uri, category, createdAt) VALUES (?, ?, ?)',
      destFile.uri,
      selectedCategory,
      new Date().toISOString()
    );

    setPhoto(null);
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <View style={styles.previewButtons}>
          <TouchableOpacity style={styles.button} onPress={() => setPhoto(null)}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={savePhoto}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />
      <CategoryOverlay category={selectedCategory} />

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
      <TouchableOpacity style={styles.galleryButton} onPress={() => router.push('/gallery')}>
        <Text style={styles.buttonText}>Gallery</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  message: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  camera: { flex: 1 },
  preview: { flex: 1 },
  previewButtons: { flexDirection: 'row', justifyContent: 'space-around', padding: 20 },
  button: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  buttonText: { fontWeight: 'bold' },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#fff' },
  galleryButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  categoryBar: {
    position: 'absolute',
    bottom: 130,
    left: 0,
    right: 0,
  },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  categoryChipSelected: {
    backgroundColor: '#fff',
  },
  categoryChipText: { color: '#fff', fontWeight: '600' },
  categoryChipTextSelected: { color: '#000' },
});