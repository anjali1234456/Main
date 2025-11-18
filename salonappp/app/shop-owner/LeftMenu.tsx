// app/shop-owner/LeftMenu.tsx
import React from "react";
import { Animated, TouchableOpacity, Text, View } from "react-native";
import { colors } from "../../styles/theme";
import { useRouter, usePathname } from "expo-router";

function LeftMenuComponent({ visible, slide, closeMenu }) {
  const router = useRouter();
  const pathname = usePathname();

  if (!visible) return null;

  const menuItems = [
    { label: "Home", route: "/shop-owner/ShopOwnerDashboard" },
    { label: "Staff", route: "/shop-owner/ShopOwnerStaffTabs" },
    { label: "Services", route: "/shop-owner/ShopOwnerServicesTabs" },
    { label: "Slot", route: "/shop-owner/ShopOwnerSlotTabs" },
    { label: "Gallery", route: "/shop-owner/ShopOwnerGallery" },
    { label: "Leaves", route: "/shop-owner/LeavesApproval" },
   
    { label: "Bookings", route: "/shop-owner/ShopOwnerBookings" },
    { label: "Profile", route: "/shop-owner/ShopOwnerProfile" },
     { label: "Setting", route: "/shop-owner/Shopwonersetting" },
  ];

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
      pointerEvents="box-none"
    >
      {/* BACKDROP */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={closeMenu}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255,255,255,0.3)",
        }}
      />

      {/* MENU */}
      <Animated.View
        style={{
          width: 270,
          height: "100%",
          backgroundColor: "#fff",
          padding: 20,
          position: "absolute",
          left: slide,
          top: 0,
        }}
      >
        <View style={{ height: 20 }} />

        {menuItems.map((item, index) => {
          const active = pathname === item.route;

          return (
            <TouchableOpacity
              key={index}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 12,
                borderRadius: 10,
                marginBottom: 14,
                backgroundColor: active ? "#FFF7C2" : "#fafafa",
              }}
              onPress={() => {
                closeMenu();
                router.replace(item.route);
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: active ? "800" : "600",
                  color: active ? colors.primary : "#444",
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
}

// ⛔ IMPORTANT: Prevents re-render → fixes keyboard closing
export default React.memo(LeftMenuComponent);
