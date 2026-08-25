/**
 * Dónde Hay - Error Boundary
 * Captura errores de JavaScript y muestra una pantalla amigable
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box flex={1} bg="background" alignItems="center" justifyContent="center" p="xl">
          <Text variant="displaySmall">💥</Text>
          <Box mt="md" alignItems="center">
            <Text variant="titleLarge" color="text" textAlign="center">
              Algo salió mal
            </Text>
          </Box>
          <Box mt="xs" alignItems="center">
            <Text variant="bodyMedium" color="textSecondary" textAlign="center">
              Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
            </Text>
          </Box>
          {__DEV__ && this.state.error && (
            <Box mt="md" p="md" bg="surfaceVariant" borderRadius="md" style={{ maxWidth: '100%' }}>
              <Text variant="labelSmall" color="error" numberOfLines={5}>
                {this.state.error.message}
              </Text>
            </Box>
          )}
          <Box mt="lg">
            <Button variant="primary" size="md" onPress={this.handleRetry}>
              Intentar de nuevo
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
