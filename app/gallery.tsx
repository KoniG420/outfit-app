import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { CATEGORIES, CategoryId } from '../lib/categories';
import { ClothingItem, db } from '../lib/db';

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;
const itemSize = screenWidth / numColumns;

export default function Gallery() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryId | null>(null);

  // NEW: separate state for the tap-to-enlarge preview
  const [viewingItem, setViewingItem] = useState<ClothingItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      const rows = db.getAllSync<ClothingItem>(
        'SELECT * FROM clothing_items ORDER BY id DESC'
      );
      setItems(rows);
    }, [])
  );

  const handleLongPress = (item: ClothingItem) => {
    setSelectedItem(item);
    setEditCategory(item.category as CategoryId);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!selectedItem || !editCategory) return;

    db.runSync(
      'UPDATE clothing_items SET category = ? WHERE id = ?',
      editCategory,
      selectedItem.id
    );

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === selectedItem.id
          ? { ...item, category: editCategory }
          : item
      )
    );

    setModalVisible(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (!selectedItem) return;

    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            db.runSync('DELETE FROM clothing_items WHERE id = ?', selectedItem.id);
            setItems(prevItems => prevItems.filter(item => item.id !== selectedItem.id));
            setModalVisible(false);
            setSelectedItem(null);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setViewingItem(item)}
            onLongPress={() => handleLongPress(item)}
            delayLongPress={500}
          >
            <Image source={{ uri: item.uri }} style={styles.item} />
          </Pressable>
        )}
      />

      {/* NEW: Tap-to-enlarge preview modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!viewingItem}
        onRequestClose={() => setViewingItem(null)}
      >
        <Pressable
          style={styles.previewOverlay}
          onPress={() => setViewingItem(null)}
        >
          {viewingItem && (
            <Image
              source={{ uri: viewingItem.uri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>

      {/* Edit Modal (unchanged, still long-press) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Item</Text>

            {selectedItem && (
              <Image
                source={{ uri: selectedItem.uri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Current Category</Text>
              <View style={styles.currentCategoryBadge}>
                <Text style={styles.currentCategoryText}>
                  {CATEGORIES.find(c => c.id === selectedItem?.category)?.label || selectedItem?.category}
                </Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Change to:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryChips}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        editCategory === cat.id && styles.categoryChipSelected,
                      ]}
                      onPress={() => setEditCategory(cat.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          editCategory === cat.id && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>

              <View style={styles.modalRightButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedItem(null);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  item: {
    width: itemSize,
    height: itemSize,
    borderWidth: 1,
    borderColor: '#000',
  },
  // NEW: preview modal styles
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    height: '80%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 15,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  currentCategoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  currentCategoryText: {
    fontSize: 16,
    color: '#333',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 5,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
  },
  categoryChipText: {
    color: '#333',
    fontSize: 14,
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  modalRightButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});