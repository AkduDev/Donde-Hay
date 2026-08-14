/**
 * Dónde Hay - Tooltip Component
 * Tooltip simple y accesible
 */

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import {
  ViewStyle,
  StyleProp,
  TextStyle,
  Pressable,
  LayoutChangeEvent,
} from 'react-native';
import { Box } from './Box';
import { Text as TextComponent } from './Text';
import { BorderRadius } from '@/theme/radius';
import { Spacing } from '@/theme/spacing';
import { Shadows, getShadow } from '@/theme/shadows';
import { ColorPalette, getColors } from '@/theme/colors';

export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: TooltipPlacement;
  offset?: number;
  delay?: number;
  closeDelay?: number;
  mode?: 'light' | 'dark';
  testID?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  arrow?: boolean;
}

const Tooltip = forwardRef<React.ComponentPropsWithoutRef<typeof Pressable>, TooltipProps>(
  (
    {
      content,
      children,
      placement = 'top',
      offset = 8,
      delay = 200,
      closeDelay = 100,
      mode = 'light',
      testID,
      style,
      contentStyle,
      textStyle,
      arrow = true,
    }: TooltipProps,
    ref
  ) => {
    const colors = getColors(mode);
    const [visible, setVisible] = useState(false);
    const [triggerLayout, setTriggerLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [tooltipLayout, setTooltipLayout] = useState<{ width: number; height: number } | null>(null);
    const showTimeout = useRef<NodeJS.Timeout | null>(null);
    const hideTimeout = useRef<NodeJS.Timeout | null>(null);
    const tooltipRef = useRef<Box>(null);

    const show = () => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = null;
      }
      showTimeout.current = setTimeout(() => {
        setVisible(true);
      }, delay);
    };

    const hide = () => {
      if (showTimeout.current) {
        clearTimeout(showTimeout.current);
        showTimeout.current = null;
      }
      hideTimeout.current = setTimeout(() => {
        setVisible(false);
      }, closeDelay);
    };

    const handleTriggerLayout = (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      setTriggerLayout({ x, y, width, height });
    };

    const handleTooltipLayout = (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setTooltipLayout({ width, height });
    };

    // Cleanup
    useEffect(() => {
      return () => {
        if (showTimeout.current) clearTimeout(showTimeout.current);
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
      };
    }, []);

    if (!triggerLayout || !tooltipLayout) {
      return (
        <Pressable
          ref={ref}
          onPressIn={show}
          onPressOut={hide}
          onHoverIn={show}
          onHoverOut={hide}
          onLongPress={show}
          testID={testID}
        >
          {React.cloneElement(children as React.ReactElement, {
            onLayout: handleTriggerLayout,
          })}
        </Pressable>
      );
    }

    const getTooltipPosition = () => {
      const { x, y, width: triggerWidth, height: triggerHeight } = triggerLayout;
      const { width: tooltipWidth, height: tooltipHeight } = tooltipLayout;
      const isRTL = false; // TODO: detect RTL

      let tooltipX = 0;
      let tooltipY = 0;
      let arrowPosition: ViewStyle = {};

      switch (placement) {
        case 'top':
        case 'top-start':
        case 'top-end':
          tooltipY = y - tooltipHeight - offset;
          if (placement === 'top-start' || (placement === 'top' && isRTL)) {
            tooltipX = x;
            arrowPosition = { left: Spacing[3] };
          } else if (placement === 'top-end' || (placement === 'top' && !isRTL)) {
            tooltipX = x + triggerWidth - tooltipWidth;
            arrowPosition = { right: Spacing[3] };
          } else {
            tooltipX = x + (triggerWidth - tooltipWidth) / 2;
            arrowPosition = { left: '50%', marginLeft: -6 };
          }
          break;

        case 'bottom':
        case 'bottom-start':
        case 'bottom-end':
          tooltipY = y + triggerHeight + offset;
          if (placement === 'bottom-start' || (placement === 'bottom' && isRTL)) {
            tooltipX = x;
            arrowPosition = { left: Spacing[3] };
          } else if (placement === 'bottom-end' || (placement === 'bottom' && !isRTL)) {
            tooltipX = x + triggerWidth - tooltipWidth;
            arrowPosition = { right: Spacing[3] };
          } else {
            tooltipX = x + (triggerWidth - tooltipWidth) / 2;
            arrowPosition = { left: '50%', marginLeft: -6 };
          }
          break;

        case 'left':
        case 'left-start':
        case 'left-end':
          tooltipX = x - tooltipWidth - offset;
          if (placement === 'left-start') {
            tooltipY = y;
            arrowPosition = { top: Spacing[3] };
          } else if (placement === 'left-end') {
            tooltipY = y + triggerHeight - tooltipHeight;
            arrowPosition = { bottom: Spacing[3] };
          } else {
            tooltipY = y + (triggerHeight - tooltipHeight) / 2;
            arrowPosition = { top: '50%', marginTop: -6 };
          }
          break;

        case 'right':
        case 'right-start':
        case 'right-end':
          tooltipX = x + triggerWidth + offset;
          if (placement === 'right-start') {
            tooltipY = y;
            arrowPosition = { top: Spacing[3] };
          } else if (placement === 'right-end') {
            tooltipY = y + triggerHeight - tooltipHeight;
            arrowPosition = { bottom: Spacing[3] };
          } else {
            tooltipY = y + (triggerHeight - tooltipHeight) / 2;
            arrowPosition = { top: '50%', marginTop: -6 };
          }
          break;
      }

      return { tooltipX, tooltipY, arrowPosition };
    };

    const { tooltipX, tooltipY, arrowPosition } = getTooltipPosition();

    const tooltipStyle: ViewStyle = {
      position: 'absolute',
      left: tooltipX,
      top: tooltipY,
      zIndex: 9999,
      maxWidth: 280,
    };

    const contentContainerStyle: ViewStyle = {
      paddingHorizontal: Spacing[3],
      paddingVertical: Spacing[2],
      borderRadius: BorderRadius.md,
      backgroundColor: colors.text,
      ...getShadow('md', mode),
      elevation: 8,
    };

    const arrowStyle: ViewStyle = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderWidth: 6,
      borderStyle: 'solid',
      ...(placement.startsWith('top') && {
        bottom: -12,
        borderColor: `${colors.text} transparent transparent transparent`,
        ...arrowPosition,
      }),
      ...(placement.startsWith('bottom') && {
        top: -12,
        borderColor: `transparent transparent ${colors.text} transparent`,
        ...arrowPosition,
      }),
      ...(placement.startsWith('left') && {
        right: -12,
        borderColor: `transparent transparent transparent ${colors.text}`,
        ...arrowPosition,
      }),
      ...(placement.startsWith('right') && {
        left: -12,
        borderColor: `transparent ${colors.text} transparent transparent`,
        ...arrowPosition,
      }),
    };

    return (
      <Pressable
        ref={ref}
        onPressIn={show}
        onPressOut={hide}
        onHoverIn={show}
        onHoverOut={hide}
        onLongPress={show}
        testID={testID}
        style={style}
      >
        {React.cloneElement(children as React.ReactElement, {
          onLayout: handleTriggerLayout,
        })}

        {visible && (
          <Box
            ref={tooltipRef}
            style={[tooltipStyle, contentStyle]}
            testID={`${testID}-tooltip`}
            mode={mode}
            onLayout={handleTooltipLayout}
          >
            <Box style={contentContainerStyle} mode={mode}>
              <TextComponent
                variant="bodySmall"
                color="textInverse"
                style={textStyle}
                mode={mode}
                testID={`${testID}-content`}
              >
                {content}
              </TextComponent>
            </Box>
            {arrow && <Box style={arrowStyle} mode={mode} testID={`${testID}-arrow`} />}
          </Box>
        )}
      </Pressable>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };
export type { TooltipProps, TooltipPlacement };