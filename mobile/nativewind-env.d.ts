/// <reference types="nativewind/types" />

import 'react-native';

// React Native'in kendi tiplerini genişletiyoruz (Module Augmentation)
declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface FlatListProps<ItemT> {
    className?: string;
  }
  interface ImageBackgroundProps {
    className?: string;
  }
}
