import { CameraView, useCameraPermissions } from 'expo-camera';
import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const db = SQLite.openDatabaseSync('outfitapp.db');

// Runs once when the app starts — creates the table if it doesn't exist yet
db.execSync(`
  CREATE TABLE IF NOT EXISTS clothing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uri TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

type ClothingItem = {
  id: number;
  uri: string;
  createdAt: string;
};

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const cameraRef = useRef<CameraView>(null);

  const loadItems = () => {
    const rows = db.getAllSync<ClothingItem>(
      'SELECT * FROM clothing_items ORDER BY id DESC'
    );
    setItems(rows);
  };

  useEffect(() => {
    loadItems();
  }, []);

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
    if (cameraRef.current) {
      const result = await cameraRef.current.takePictureAsync();
      if (result) setPhoto(result.uri);
    }
  };

  const savePhoto = () => {
    if (!photo) return;

    // Copy from the temporary camera cache into permanent app storage
    const sourceFile = new File(photo);
    const destFile = new File(Paths.document, `clothing_${Date.now()}.jpg`);
    sourceFile.copy(destFile);

    // Record it in the database
    db.runSync(
      'INSERT INTO clothing_items (uri, createdAt) VALUES (?, ?)',
      destFile.uri,
      new Date().toISOString()
    );

    setPhoto(null);
    loadItems();
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
      <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
        <View style={styles.captureButtonInner} />
      </TouchableOpacity>

      <ScrollView horizontal style={styles.gallery} contentContainerStyle={{ gap: 8 }}>
        {items.map((item) => (
          <Image key={item.id} source={{ uri: item.uri }} style={styles.thumbnail} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  message: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  camera: { flex: 1 },
  preview: { flex: 1 },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
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
    bottom: 100,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#fff',
  },
  gallery: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    maxHeight: 70,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 8,
  },
});