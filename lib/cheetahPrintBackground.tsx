import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, Pattern, Rect } from 'react-native-svg';

type Props = {
  baseColor?: string;
  spotColor?: string;
};

export function CheetahPrintBackground({
  baseColor = '#e8c27a',
  spotColor = '#3d2712',
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {size.width > 0 && size.height > 0 && (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <Pattern id="cheetah" width={36} height={36} patternUnits="userSpaceOnUse">
              <Rect width={36} height={36} fill={baseColor} />
              <Ellipse cx={9} cy={8} rx={5} ry={3.5} fill={spotColor} transform="rotate(20 9 8)" />
              <Ellipse cx={26} cy={5} rx={3.5} ry={2.5} fill={spotColor} transform="rotate(-15 26 5)" />
              <Ellipse cx={4} cy={24} rx={3.5} ry={2.5} fill={spotColor} transform="rotate(10 4 24)" />
              <Ellipse cx={22} cy={27} rx={5} ry={3.5} fill={spotColor} transform="rotate(-25 22 27)" />
              <Ellipse cx={31} cy={18} rx={2.5} ry={2.5} fill={spotColor} />
              <Ellipse cx={14} cy={18} rx={2} ry={2} fill={spotColor} />
            </Pattern>
          </Defs>
          <Rect width={size.width} height={size.height} fill="url(#cheetah)" />
        </Svg>
      )}
    </View>
  );
}