import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CATEGORIES, CategoryId } from '../lib/categories';
import { ClothingItem, db } from '../lib/db';

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;
const itemSize = screenWidth / numColumns;

export default function FitMaker() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [items, setItems] = useState<ClothingItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!selectedCategory) {
        setItems([]);
        return;
      }
      const rows = db.getAllSync<ClothingItem>(
        'SELECT * FROM clothing_items WHERE category = ? ORDER BY id DESC',
        selectedCategory
      );
      setItems(rows);
    }, [selectedCategory])
  );

  return (
    <View style={styles.container}>
      {/* Category selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryBar}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
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

      {/* Items grid */}
      {!selectedCategory ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Pick a category above to see your pieces</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No items saved in this category yet</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          renderItem={({ item }) => (
            <Image source={{ uri: item.uri }} style={styles.item} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  categoryBar: {
    flexGrow: 0,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  categoryChip: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  categoryChipSelected: {
    backgroundColor: '#fff',
  },
  categoryChipText: { color: '#fff', fontWeight: '600' },
  categoryChipTextSelected: { color: '#000' },
  item: {
    width: itemSize,
    height: itemSize,
    borderWidth: 1,
    borderColor: '#000',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});