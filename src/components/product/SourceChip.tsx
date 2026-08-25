/**
 * Dónde Hay - SourceChip Component
 * Badge/chip showing the data source with appropriate color
 */

import React from 'react';
import { Box } from '@/components/ui/Box';
import { Text } from '@/components/ui/Text';
import { useThemeStore } from '@/store/themeStore';
import { SOURCES } from '@/config';
import { getSourceIcon } from '@/utils/format';

export interface SourceChipProps {
  sourceId: string;
  count?: number;
  size?: 'xs' | 'sm' | 'md';
  showCount?: boolean;
}

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  revolico: { bg: '#FEF2E8', text: '#E44D26' },
  facebook: { bg: '#EBF5FF', text: '#1877F2' },
  instagram: { bg: '#FEE8ED', text: '#E4405F' },
  telegram: { bg: '#E6F4FB', text: '#0088CC' },
  '1cuba': { bg: '#EBF5FF', text: '#1877F2' },
  choleslibres: { bg: '#E8FAF0', text: '#25D366' },
  comunidad: { bg: '#E8FAF0', text: '#22C55E' },
};

const DARK_SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  revolico: { bg: '#3D1E0A', text: '#F59E0B' },
  facebook: { bg: '#0D2744', text: '#60A5FA' },
  instagram: { bg: '#3D0A1A', text: '#F472B6' },
  telegram: { bg: '#0A2A3D', text: '#38BDF8' },
  '1cuba': { bg: '#0D2744', text: '#60A5FA' },
  choleslibres: { bg: '#0A2D1A', text: '#4ADE80' },
  comunidad: { bg: '#0A2D1A', text: '#4ADE80' },
};

const SIZE_STYLES = {
  xs: { px: 'xxs' as const, py: 'xxxs' as const, textVariant: 'labelSmall' as const },
  sm: { px: 'xs' as const, py: 'xxs' as const, textVariant: 'labelSmall' as const },
  md: { px: 'sm' as const, py: 'xs' as const, textVariant: 'labelMedium' as const },
};

export function SourceChip({
  sourceId,
  count,
  size = 'sm',
  showCount = true,
}: SourceChipProps) {
  const { resolvedMode } = useThemeStore();
  const isDark = resolvedMode === 'dark';
  const source = SOURCES[sourceId as keyof typeof SOURCES];
  const sourceName = source?.name ?? sourceId;
  const icon = getSourceIcon(sourceId);
  const sizeStyle = SIZE_STYLES[size];

  const colorMap = isDark ? DARK_SOURCE_COLORS : SOURCE_COLORS;
  const sourceColors = colorMap[sourceId] ?? {
    bg: isDark ? '#1E293B' : '#F1F5F9',
    text: isDark ? '#94A3B8' : '#64748B',
  };

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      gap="xxxs"
      px={sizeStyle.px}
      py={sizeStyle.py}
      borderRadius="sm"
      style={{ backgroundColor: sourceColors.bg }}
    >
      <Text variant="bodySmall" style={{ fontSize: size === 'xs' ? 10 : 12 }}>
        {icon}
      </Text>
      <Text
        variant={sizeStyle.textVariant}
        style={{ color: sourceColors.text }}
      >
        {sourceName}
      </Text>
      {showCount && count !== undefined && count > 0 && (
        <Text
          variant="labelSmall"
          style={{ color: sourceColors.text, opacity: 0.7 }}
        >
          ({count})
        </Text>
      )}
    </Box>
  );
}
