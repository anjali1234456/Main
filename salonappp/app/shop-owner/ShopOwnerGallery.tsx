import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import Toast from "react-native-toast-message";
import { db } from "../../src/firebase/firebaseConfig";
import { colors, serviceStyles } from "../../styles/theme";

// ⭐ Header + Footer + LeftMenu
import ShopOwnerHeader from "./ShopOwnerHeader";
import ShopOwnerBottomNav from "./ShopOwnerBottomNav";
import LeftMenu from "./LeftMenu";

// ⭐ Conditional import for Maps
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
}

export default function ShopOwnerGallery() {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [shopPic, setShopPic] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [menuCards, setMenuCards] = useState<string[]>([]);
  const [location, setLocation] = useState({ latitude: 12.9716, longitude: 77.5946 });
  const [address, setAddress] = useState<string>("");
  const [slotBookingAmount, setSlotBookingAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // ⭐ EDIT MODE
  const [editMode, setEditMode] = useState(false);

  // ⭐ Left Menu Animation
  const [menuVisible, setMenuVisible] = useState(false);
  const slide = useRef(new Animated.Value(-270)).current;

  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(slide, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slide, {
      toValue: -270,
      duration: 200,
      useNativeDriver: false,
    }).start(() => setMenuVisible(false));
  };

  const CLOUD_NAME = "dxuvabjwx";
  const UPLOAD_PRESET = "expo_upload";

  useEffect(() => {
    const init = async () => {
      const sid = await AsyncStorage.getItem("shopId");
      if (sid) {
        setSalonId(sid);
        loadGallery(sid);
      }
    };
    init();
  }, []);

  const loadGallery = async (sid: string) => {
    try {
      const snap = await getDoc(doc(db, "galleries", sid));
      if (snap.exists()) {
        const data: any = snap.data();
        setShopPic(data.shopPic || null);
        setGallery(data.gallery || []);
        setMenuCards(data.menuCards || []);
        if (data.location) setLocation(data.location);
        if (data.address) setAddress(data.address);
        if (data.slotBookingAmount)
          setSlotBookingAmount(String(data.slotBookingAmount));
        if (data.category) setCategory(data.category);
      }
    } catch (e) {
      console.error(e);
      Toast.show({
        type: "error",
        text1: "Failed to load data",
      });
    }
  };

  const uploadToCloudinary = async (uri: string) => {
    try {
      const data = new FormData();
      data.append("file", { uri, type: "image/jpeg", name: "upload.jpg" } as any);
      data.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      return result.secure_url || null;
    } catch (err) {
      Toast.show({ type: "error", text1: "Upload failed" });
      return null;
    }
  };

  const pickImage = async (type: "shop" | "gallery" | "menu") => {
    if (!editMode)
      return Toast.show({ type: "info", text1: "Enable edit mode to change images" });

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Toast.show({ type: "error", text1: "Permission denied" });

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: type !== "shop",
      quality: 0.7,
    });

    if (result.canceled) return;

    setUploading(true);

    if (type === "shop") {
      const up = await uploadToCloudinary(result.assets[0].uri);
      if (up) setShopPic(up);
    } else {
      const uploads = await Promise.all(
        result.assets.map((i) => uploadToCloudinary(i.uri))
      );
      const valid = uploads.filter((u): u is string => !!u);

      if (type === "gallery") setGallery((x) => [...x, ...valid]);
      if (type === "menu") setMenuCards((x) => [...x, ...valid]);
    }

    Toast.show({ type: "success", text1: "Uploaded!" });
    setUploading(false);
  };

  const deleteImage = (type: "gallery" | "menu", uri: string) => {
    if (!editMode)
      return Toast.show({ type: "info", text1: "Enable edit mode to delete" });

    if (type === "gallery") setGallery(gallery.filter((i) => i !== uri));
    if (type === "menu") setMenuCards(menuCards.filter((i) => i !== uri));

    Toast.show({ type: "success", text1: "Deleted!" });
  };

  const saveAll = async () => {
    if (!editMode)
      return Toast.show({ type: "info", text1: "Enable edit mode first" });

    if (!salonId)
      return Toast.show({ type: "error", text1: "Missing salon ID" });

    try {
      setUploading(true);

      await setDoc(
        doc(db, "galleries", salonId),
        {
          salonId,
          shopPic,
          gallery,
          menuCards,
          location,
          address,
          category,
          slotBookingAmount: Number(slotBookingAmount),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      Toast.show({
        type: "success",
        text1: "Saved!",
        text2: "Gallery updated successfully.",
      });

      setEditMode(false);
    } catch (e) {
      console.error(e);
      Toast.show({ type: "error", text1: "Save failed" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ⭐ HEADER */}
      <ShopOwnerHeader openMenu={openMenu} title="Gallery Management" />

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 180, // ⭐ Added bottom spacing
        }}
      >
        {/* ⭐ EDIT BUTTON */}
        <TouchableOpacity
          onPress={() => setEditMode((x) => !x)}
          style={{
            backgroundColor: editMode ? "orange" : colors.primary,
            padding: 10,
            borderRadius: 8,
            marginBottom: 20,
            alignSelf: "flex-end",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {editMode ? "Save Mode Enabled" : "Enable Edit"}
          </Text>
        </TouchableOpacity>

        {/* SHOP PICTURE */}
        <Text style={{ color: colors.textLight, marginBottom: 8 }}>🏪 Shop Picture</Text>

        <TouchableOpacity style={serviceStyles.imageBox} onPress={() => pickImage("shop")}>
          <Text style={serviceStyles.imagePlaceholder}>
            {editMode ? "Change Picture" : "View Picture"}
          </Text>
        </TouchableOpacity>

        {shopPic && (
          <Image
            source={{ uri: shopPic }}
            style={{ width: "100%", height: 200, borderRadius: 8 }}
          />
        )}

        {/* CATEGORY */}
        <Text style={{ color: colors.textLight, marginTop: 20 }}>🏷️ Category</Text>
        <View style={{ flexDirection: "row", marginVertical: 12 }}>
          {["Men", "Women", "Spa"].map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => editMode && setCategory(c)}
              style={{
                padding: 10,
                marginRight: 10,
                borderRadius: 10,
                backgroundColor: category === c ? colors.primary : "#ccc",
              }}
            >
              <Text>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* GALLERY */}
        <Text style={{ color: colors.textLight }}>📸 Gallery Images</Text>
        <TouchableOpacity style={serviceStyles.imageBox} onPress={() => pickImage("gallery")}>
          <Text style={serviceStyles.imagePlaceholder}>Add Gallery Images</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {gallery.map((uri, i) => (
            <View key={i} style={{ margin: 6 }}>
              <Image source={{ uri }} style={serviceStyles.previewImage} />

              {editMode && (
                <TouchableOpacity
                  onPress={() => deleteImage("gallery", uri)}
                  style={{
                    backgroundColor: "red",
                    position: "absolute",
                    right: -6,
                    top: -6,
                    padding: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "#fff" }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* MENU CARDS */}
        <Text style={{ color: colors.textLight, marginTop: 20 }}>🍽️ Menu Cards</Text>

        <TouchableOpacity style={serviceStyles.imageBox} onPress={() => pickImage("menu")}>
          <Text style={serviceStyles.imagePlaceholder}>Add Menu Cards</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {menuCards.map((uri, i) => (
            <View key={i} style={{ margin: 6 }}>
              <Image source={{ uri }} style={serviceStyles.previewImage} />

              {editMode && (
                <TouchableOpacity
                  onPress={() => deleteImage("menu", uri)}
                  style={{
                    backgroundColor: "red",
                    position: "absolute",
                    right: -6,
                    top: -6,
                    padding: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "#fff" }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* ADDRESS */}
        <Text style={{ color: colors.textLight, marginTop: 20 }}>📍 Address</Text>
        <TextInput
          editable={editMode}
          placeholder="Salon Address"
          value={address}
          onChangeText={setAddress}
          style={serviceStyles.input}
        />

        {/* BOOKING AMOUNT */}
        <Text style={{ color: colors.textLight, marginTop: 20 }}>💰 Slot Amount</Text>

        <TextInput
          editable={editMode}
          value={slotBookingAmount}
          onChangeText={setSlotBookingAmount}
          placeholder="Amount"
          keyboardType="numeric"
          style={serviceStyles.input}
        />

        {/* MAP */}
        {Platform.OS !== "web" && MapView && (
          <MapView
            style={{
              width: "100%",
              height: 200,
              borderRadius: 10,
              marginTop: 20,
              marginBottom: 20,
            }}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker
              draggable={editMode}
              coordinate={location}
              onDragEnd={(e) => editMode && setLocation(e.nativeEvent.coordinate)}
            />
          </MapView>
        )}

        {/* SAVE BUTTON */}
        {editMode && (
          <TouchableOpacity
            style={[serviceStyles.submitButton, uploading && { opacity: 0.5 }]}
            onPress={saveAll}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={serviceStyles.submitButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ⭐ FOOTER NAV */}
      <ShopOwnerBottomNav />

      {/* ⭐ LEFT MENU */}
      <LeftMenu visible={menuVisible} slide={slide} closeMenu={closeMenu} />

      {/* ⭐ GLOBAL TOAST */}
      <Toast />
    </View>
  );
}
