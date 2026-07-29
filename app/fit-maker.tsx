import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { CATEGORIES, CategoryId } from '../lib/categories';
import { ClothingItem, db } from '../lib/db';
import { LAYERS } from '../lib/layers';

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;
const itemSize = screenWidth / numColumns;
const canvasHeight = screenWidth * 1.2;

type Transform = { x: number; y: number; scale: number };
type Selection = { item: ClothingItem; transform: Transform };

// A piece sitting on the canvas — draggable (pan) and resizable (pinch)
function DraggableCanvasItem({
  category,
  selection,
  isActive,
  onActivate,
  onCommit,
}: {
  category: string;
  selection: Selection;
  isActive: boolean;
  onActivate: () => void;
  onCommit: (t: Transform) => void;
}) {
  const translateX = useSharedValue(selection.transform.x);
  const translateY = useSharedValue(selection.transform.y);
  const scale = useSharedValue(selection.transform.scale);
  const savedX = useSharedValue(selection.transform.x);
  const savedY = useSharedValue(selection.transform.y);
  const savedScale = useSharedValue(selection.transform.scale);

  const commit = () => {
    onCommit({ x: translateX.value, y: translateY.value, scale: scale.value });
  };

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onActivate)();
  });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
      runOnJS(commit)();
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.3, Math.min(2.5, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      runOnJS(commit)();
    });

  const composed = Gesture.Race(tapGesture, Gesture.Simultaneous(panGesture, pinchGesture));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[styles.canvasItemWrap, animatedStyle, isActive && styles.canvasItemActive]}
      >
        <Image source={{ uri: selection.item.uri }} style={styles.canvasImage} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

export default function FitMaker() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [viewingItem, setViewingItem] = useState<ClothingItem | null>(null);

  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [draggingItem, setDraggingItem] = useState<ClothingItem | null>(null);

  const canvasRef = useRef<View>(null);
  const canvasBounds = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);

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

  const isGridItemSelected = (item: ClothingItem) => selections[item.category]?.item.id === item.id;

  const quickAdd = (item: ClothingItem) => {
    setSelections((prev) => {
      const existing = prev[item.category];
      if (existing?.item.id === item.id) {
        const next = { ...prev };
        delete next[item.category];
        return next;
      }
      return { ...prev, [item.category]: { item, transform: { x: 0, y: 0, scale: 1 } } };
    });
    setActiveCategory(item.category);
  };

  const handleDrop = (item: ClothingItem, absX: number, absY: number) => {
    const b = canvasBounds.current;
    const insideCanvas =
      absX >= b.x && absX <= b.x + b.width && absY >= b.y && absY <= b.y + b.height;

    if (insideCanvas) {
      const offsetX = absX - (b.x + b.width / 2);
      const offsetY = absY - (b.y + b.height / 2);
      setSelections((prev) => ({
        ...prev,
        [item.category]: { item, transform: { x: offsetX, y: offsetY, scale: 1 } },
      }));
      setActiveCategory(item.category);
    }
    setDraggingItem(null);
  };

  const commitTransform = (category: string, transform: Transform) => {
    setSelections((prev) =>
      prev[category] ? { ...prev, [category]: { ...prev[category], transform } } : prev
    );
  };

  const ghostStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ghostX.value - itemSize / 2 },
      { translateY: ghostY.value - itemSize / 2 },
    ],
  }));

  const backgroundTap = Gesture.Tap().onEnd(() => {
    runOnJS(setActiveCategory)(null);
  });

  return (
    <View style={styles.container}>
      {/* Outfit canvas */}
      <GestureDetector gesture={backgroundTap}>
        <View
          ref={canvasRef}
          style={[styles.canvas, { height: canvasHeight }]}
          onLayout={() => {
            canvasRef.current?.measureInWindow((x, y, width, height) => {
              canvasBounds.current = { x, y, width, height };
            });
          }}
        >
          {LAYERS.flatMap((layer) =>
            layer.categories
              .filter((cat) => selections[cat])
              .map((cat) => (
                <DraggableCanvasItem
                  key={cat}
                  category={cat}
                  selection={selections[cat]}
                  isActive={activeCategory === cat}
                  onActivate={() => setActiveCategory(cat)}
                  onCommit={(t) => commitTransform(cat, t)}
                />
              ))
          )}
          {Object.keys(selections).length === 0 && !draggingItem && (
            <Text style={styles.canvasEmptyText}>Tap or drag pieces below to build your outfit</Text>
          )}
        </View>
      </GestureDetector>

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
          renderItem={({ item }) => {
            const tapGesture = Gesture.Tap().onEnd(() => {
              runOnJS(quickAdd)(item);
            });

            const dragGesture = Gesture.Pan()
              .activateAfterLongPress(250)
              .onStart((e) => {
                ghostX.value = e.absoluteX;
                ghostY.value = e.absoluteY;
                runOnJS(setDraggingItem)(item);
              })
              .onUpdate((e) => {
                ghostX.value = e.absoluteX;
                ghostY.value = e.absoluteY;
              })
              .onEnd((e) => {
                runOnJS(handleDrop)(item, e.absoluteX, e.absoluteY);
              });

            const composed = Gesture.Race(tapGesture, dragGesture);

            return (
              <View style={[styles.itemWrap, isGridItemSelected(item) && styles.itemWrapSelected]}>
                <GestureDetector gesture={composed}>
                  <Animated.View style={StyleSheet.absoluteFill}>
                    <Image source={{ uri: item.uri }} style={styles.item} />
                  </Animated.View>
                </GestureDetector>
                <Pressable style={styles.eyeButton} onPress={() => setViewingItem(item)}>
                  <Text style={styles.eyeIcon}>👁</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}

      {/* Floating ghost image while dragging from the grid */}
      {draggingItem && (
        <Animated.View pointerEvents="none" style={[styles.ghost, ghostStyle]}>
          <Image source={{ uri: draggingItem.uri }} style={styles.ghostImage} resizeMode="contain" />
        </Animated.View>
      )}

      {/* Enlarge preview */}
      <Modal animationType="fade" transparent visible={!!viewingItem} onRequestClose={() => setViewingItem(null)}>
        <Pressable style={styles.previewOverlay} onPress={() => setViewingItem(null)}>
          {viewingItem && (
            <Image source={{ uri: viewingItem.uri }} style={styles.previewImage} resizeMode="contain" />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  canvas: {
    width: '100%',
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  canvasItemWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  canvasItemActive: {
    borderWidth: 2,
    borderColor: '#ff2fb4',
    borderStyle: 'dashed',
  },
  canvasImage: { width: '100%', height: '100%' },
  canvasEmptyText: { color: '#555', fontSize: 13 },
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
  categoryChipSelected: { backgroundColor: '#fff' },
  categoryChipText: { color: '#fff', fontWeight: '600' },
  categoryChipTextSelected: { color: '#000' },
  itemWrap: { width: itemSize, height: itemSize, borderWidth: 2, borderColor: '#000' },
  itemWrapSelected: { borderColor: '#ff2fb4' },
  item: { width: '100%', height: '100%' },
  eyeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: { fontSize: 12 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center' },
  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: itemSize,
    height: itemSize,
    opacity: 0.85,
    zIndex: 999,
  },
  ghostImage: { width: '100%', height: '100%' },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '90%', height: '80%' },
});