import { Platform } from "react-native";
import { supabase } from "./supabase";
import { logger } from "./logger";

export async function registerPushToken(userId: string): Promise<void> {
  try {
    // Dynamic require — expo-notifications may not be installed yet
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require("expo-notifications") as {
      getPermissionsAsync: () => Promise<{ status: string }>;
      requestPermissionsAsync: () => Promise<{ status: string }>;
      getExpoPushTokenAsync: () => Promise<{ data: string }>;
      setNotificationChannelAsync: (id: string, opts: { name: string; importance: number }) => Promise<void>;
      AndroidImportance: { MAX: number };
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Device = require("expo-device") as { isDevice: boolean };

    if (!Device.isDevice) {
      logger.info("push.skip_simulator");
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      logger.warn("push.permission_denied");
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // device_tokens tablosu henüz mevcut değilse hata loglanır ama uygulama patlamaz
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)("device_tokens").upsert({
      user_id: userId,
      token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logger.error("push.token_save_failed", { error: (error as { message: string }).message });
    } else {
      logger.info("push.token_registered", { platform: Platform.OS });
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
  } catch (err) {
    logger.warn("push.not_available", { err: String(err) });
  }
}
