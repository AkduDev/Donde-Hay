/**
 * Dónde Hay - ProductCardSkeleton Component
 * Placeholder de card de producto para loading states (imita shapes de ProductCard)
 */

import React from 'react';
import { Box } from '@/components/ui/Box';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useThemeStore } from '@/store/themeStore';

export interface ProductCardSkeletonProps {
  layout?: 'list' | 'grid';
  count?: number;
  testID?: string;
}

const ProductCardSkeleton = React.memo(({
  layout = 'list',
  count = 1,
  testID,
}: ProductCardSkeletonProps) => {
  const { resolvedMode } = useThemeStore();
  const isGrid = layout === 'grid';

  const renderCard = (index: number) => (
    <Card
      key={index}
      variant="elevated"
      padding={isGrid ? 'xs' : 'md'}
      style={{ width: isGrid ? '100%' : undefined }}
      mode={resolvedMode}
    >
      {isGrid ? (
        <Box mode={resolvedMode}>
          <Skeleton width="100%" height={140} borderRadius="md" testID={`${testID}-image-${index}`} />
          <Box mt="sm" gap="xxxs">
            <Skeleton width="90%" height={16} borderRadius="xs" />
            <Skeleton width="60%" height={14} borderRadius="xs" />
          </Box>
          <Box mt="sm" flexDirection="row" justifyContent="space-between" alignItems="center">
            <Skeleton width={70} height={20} borderRadius="full" />
            <Skeleton width={48} height={14} borderRadius="xs" />
          </Box>
        </Box>
      ) : (
        <Box flexDirection="row" gap="md" mode={resolvedMode}>
          <Skeleton width={100} height={100} borderRadius="md" testID={`${testID}-image-${index}`} />
          <Box flex={1} gap="xxs" mode={resolvedMode}>
            <Skeleton width="85%" height={16} borderRadius="xs" />
            <Skeleton width="50%" height={14} borderRadius="xs" />
            <Skeleton width={90} height={22} borderRadius="xs" />
            <Skeleton width="70%" height={14} borderRadius="xs" />
            <Box mt="xxs" flexDirection="row" justifyContent="space-between">
              <Skeleton width={72} height={20} borderRadius="full" />
              <Skeleton width={40} height={14} borderRadius="xs" />
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  );

  return (
    <Box gap="sm" mode={resolvedMode} testID={testID}>
      {Array.from({ length: count }).map((_, index) => renderCard(index))}
    </Box>
  );
});

ProductCardSkeleton.displayName = 'ProductCardSkeleton';

export { ProductCardSkeleton };