import QRCode from 'qrcode';
import { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';

/** Draws a scannable QR code for `value` as crisp vector squares. */
export function QrCode({ value, size = 240, color = Colors.text }: { value: string; size?: number; color?: string }) {
  const { path, count } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
    const n = qr.modules.size;
    let d = '';
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (qr.modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`;
      }
    }
    return { path: d, count: n };
  }, [value]);

  const quiet = 2; // white border so phone cameras can find the code
  const total = count + quiet * 2;

  return (
    <Svg width={size} height={size} viewBox={`${-quiet} ${-quiet} ${total} ${total}`} accessibilityLabel="QR code">
      <Rect x={-quiet} y={-quiet} width={total} height={total} fill="#FFFFFF" />
      <Path d={path} fill={color} />
    </Svg>
  );
}
