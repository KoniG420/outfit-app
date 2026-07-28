import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, View } from 'react-native';
import { ClothingItem, db } from '../lib/db';

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;
const itemSize = screenWidth / numColumns;

export default function Gallery() {
  const [items, setItems] = useState<ClothingItem[]>([]);

  // Reloads every time this screen comes into focus (e.g. navigating back
  // to it after saving a new photo), not just on first mount
  useFocusEffect(
    useCallback(() => {
      const rows = db.getAllSync<ClothingItem>(
        'SELECT * FROM clothing_items ORDER BY id DESC'
      );
      setItems(rows);
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <Image source={{ uri: item.uri }} style={styles.item} />
        )}
      />
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
});