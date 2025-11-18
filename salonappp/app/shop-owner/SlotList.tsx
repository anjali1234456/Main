import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../src/firebase/firebaseConfig";
import { colors, serviceStyles } from "../../styles/theme";

export default function SlotList() {
  const [slots, setSlots] = useState<any[]>([]);

  const loadSlots = async () => {
    const snap = await getDocs(collection(db, "slots"));
    let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // ✅ Convert date string → Date and sort latest first
    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    setSlots(data);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleDelete = async (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this slot?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "slots", id));
          loadSlots();
          Alert.alert("🗑️ Slot deleted successfully!");
        },
      },
    ]);
  };

  const toggleAvailability = async (id: string, status: string) => {
    const newStatus = status === "available" ? "unavailable" : "available";
    await updateDoc(doc(db, "slots", id), { status: newStatus });
    loadSlots();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Text style={[serviceStyles.title, { marginBottom: 10 }]}>
        📋 Slot List
      </Text>

      <FlatList
        data={slots}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        renderItem={({ item }) => (
          <View
            style={[
              serviceStyles.card,
              {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#fff",
                marginBottom: 10,
                padding: 12,
                borderRadius: 12,
                elevation: 2,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[serviceStyles.cardTitle, { color: "#000" }]}>
                {item.date} | {item.fromTime} - {item.toTime}
              </Text>

              <Text style={{ color: colors.textLight }}>
                {item.barberName || "No Barber"}
              </Text>

              {item.note ? (
                <Text style={{ color: "#666" }}>📝 {item.note}</Text>
              ) : null}

              <Text
                style={{
                  color:
                    item.status === "available" ? colors.primary : "red",
                  fontWeight: "600",
                }}
              >
                {item.status === "available"
                  ? "✅ Available"
                  : "🚫 Unavailable"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Toggle status */}
              <TouchableOpacity
                onPress={() => toggleAvailability(item.id, item.status)}
                style={{
                  backgroundColor:
                    item.status === "available" ? "#ffe5e5" : "#e6ffe6",
                  borderRadius: 50,
                  padding: 8,
                  marginHorizontal: 6,
                }}
              >
                <Icon
                  name={
                    item.status === "available"
                      ? "close-circle-outline"
                      : "check-circle-outline"
                  }
                  size={24}
                  color={
                    item.status === "available"
                      ? "#cc0000"
                      : colors.primary
                  }
                />
              </TouchableOpacity>

              {/* Delete */}
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={{
                  backgroundColor: "#ffe5e5",
                  borderRadius: 50,
                  padding: 8,
                  marginHorizontal: 6,
                }}
              >
                <Icon name="delete-outline" size={24} color="#cc0000" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={serviceStyles.emptyText}>No slots found.</Text>
        }
      />
    </View>
  );
}
