import React from 'react';
import { View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeScreenProps extends ViewProps {
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

export const SafeScreen: React.FC<SafeScreenProps> = ({ style, children, edges, ...props }) => {
  const insets = useSafeAreaInsets();
  const appliedEdges = edges || ['top', 'bottom', 'left', 'right'];
  return (
    <View
      style={[
        { flex: 1 },
        appliedEdges.includes('top') && { paddingTop: insets.top },
        appliedEdges.includes('bottom') && { paddingBottom: insets.bottom },
        appliedEdges.includes('left') && { paddingLeft: insets.left },
        appliedEdges.includes('right') && { paddingRight: insets.right },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

