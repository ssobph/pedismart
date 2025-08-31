import { typography } from '@/constants/StyleGuide';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Text, View, type TextProps, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
    lightColor?: string;
    darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
    return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

export type ThemedTextProps = TextProps & {
    lightColor?: string;
    darkColor?: string;
    type?: keyof typeof typography;
};

export function ThemedText({ style, lightColor, darkColor, type = 'body', ...rest }: ThemedTextProps) {
    const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
    return <Text style={[{ color }, typography[type], style]} {...rest} />;
}