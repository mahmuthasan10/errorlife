import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { logger } from "../lib/logger";

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error("react.error_boundary", {
      message: error.message,
      stack: info.componentStack?.slice(0, 500) ?? "",
    });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Text className="text-white text-lg font-bold mb-2">
          Beklenmedik bir hata
        </Text>
        <Text className="text-zinc-400 text-sm text-center mb-6">
          {this.state.error.message}
        </Text>
        <TouchableOpacity
          onPress={this.reset}
          className="bg-[#1D9BF0] rounded-full px-6 py-2"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">Tekrar dene</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
