import { Dimensions, Image, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { CategoryId } from './categories';
import { OVERLAY_IMAGES } from './overlayImages';

const { width, height } = Dimensions.get('window');

export function CategoryOverlay({ category }: { category: CategoryId | null }) {
  if (!category) return null;

  const image = OVERLAY_IMAGES[category];

  if (image) {
  return (
      <Image
        source={image}
        style={styles.overlayImage}
        resizeMode="contain"
      />
  );
}

  // Fallback for categories without custom art yet
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect
        x={width * 0.15}
        y={height * 0.15}
        width={width * 0.7}
        height={height * 0.5}
        rx={20}
        stroke="white"
        strokeWidth={3}
        strokeDasharray="10,8"
        fill="rgba(255,255,255,0.05)"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  overlayImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    opacity: 0.6,
  },
});