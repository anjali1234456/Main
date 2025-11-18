// app/shop-owner/ShopOwnerBottomNav.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { colors } from "../../styles/theme";
import MyCoins from "./MyCoins";

export default function ShopOwnerBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  // Coins bottom sheet animation
  const [showCoins, setShowCoins] = useState(false);
  const slideAnim = useState(new Animated.Value(400))[0];

  const openSheet = () => {
    setShowCoins(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setShowCoins(false));
  };

  return (
    <>
      {/* ⭐ Bottom Navigation */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          paddingVertical: 8,
          borderTopWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 70,
          elevation: 20,
        }}
      >
        {/* HOME */}
        <TouchableOpacity
          style={{ width: 80, alignItems: "center" }}
          onPress={() => router.replace("/shop-owner/ShopOwnerDashboard")}
        >
          <Ionicons
            name="home-outline"
            size={26}
            color={isActive("/shop-owner/ShopOwnerDashboard") ? colors.primary : "#777"}
          />
          <Text style={{ fontSize: 12 }}>Home</Text>
        </TouchableOpacity>

        {/* BOOKINGS */}
        <TouchableOpacity
          style={{ width: 80, alignItems: "center" }}
          onPress={() => router.replace("/shop-owner/ShopOwnerBookings")}
        >
          <Ionicons
            name="book-outline"
            size={26}
            color={isActive("/shop-owner/ShopOwnerBookings") ? colors.primary : "#777"}
          />
          <Text style={{ fontSize: 12 }}>Bookings</Text>
        </TouchableOpacity>

        {/* SLOTS */}
        <TouchableOpacity
          style={{ width: 80, alignItems: "center" }}
          onPress={() => router.replace("/shop-owner/ShopOwnerSlotTabs")}
        >
          <Ionicons
            name="time-outline"
            size={26}
            color={isActive("/shop-owner/ShopOwnerSlot") ? colors.primary : "#777"}
          />
          <Text style={{ fontSize: 12 }}>Slots</Text>
        </TouchableOpacity>

        {/* COINS */}
        <TouchableOpacity
          style={{ width: 80, alignItems: "center" }}
          onPress={openSheet}
        >
          <Ionicons
            name="wallet-outline"
            size={26}
            color={colors.primary}
          />
          <Text style={{ fontSize: 12, color: colors.primary }}>Coins</Text>
        </TouchableOpacity>
      </View>

      {/* ⭐ Bottom Sheet / Coins */}
      <Modal visible={showCoins} transparent animationType="none">
        <TouchableWithoutFeedback onPress={closeSheet}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "flex-end",
            }}
          >
            <Animated.View
              style={{
                height: "50%",
                backgroundColor: "#fff",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 20,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 6,
                  backgroundColor: "#ccc",
                  borderRadius: 3,
                  alignSelf: "center",
                  marginVertical: 10,
                }}
              />

              <MyCoins />
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
