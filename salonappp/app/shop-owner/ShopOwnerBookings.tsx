// PERFECT TABLE VERSION

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { db } from "../../src/firebase/firebaseConfig";
import { colors } from "../../styles/theme";

// Header, Footer, Menu
import ShopOwnerHeader from "./ShopOwnerHeader";
import ShopOwnerBottomNav from "./ShopOwnerBottomNav";
import LeftMenu from "./LeftMenu";

export default function ShopOwnerBookings() {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Menu Animation
  const [menuVisible, setMenuVisible] = useState(false);
  const slide = useRef(new Animated.Value(-270)).current;

  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(slide, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };
  const closeMenu = () => {
    Animated.timing(slide, { toValue: -270, duration: 200, useNativeDriver: false }).start(() => setMenuVisible(false));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const sid = await AsyncStorage.getItem("shopId");
        if (!sid) return;
        setSalonId(sid);

        const barberSnap = await getDocs(query(collection(db, "barbers"), where("salonId", "==", sid)));
        setBarbers(barberSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const bookingSnap = await getDocs(query(collection(db, "userBookings"), where("salonId", "==", sid)));
        const data = bookingSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setBookings(data);
        setFilteredBookings(data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const applyFilters = (barberId: string, date?: Date | null) => {
    let filtered = bookings;

    if (barberId !== "all") filtered = filtered.filter((b) => b.barberId === barberId);
    if (date) filtered = filtered.filter((b) => b.date === date.toDateString());

    setFilteredBookings(filtered);
  };

  const renderBooking = ({ item, index }) => (
    <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
      <Text style={[styles.cell, styles.col1]}>{item.barberName || "—"}</Text>
      <Text style={[styles.cell, styles.col2]}>{item.slotTime}</Text>
      <Text style={[styles.cell, styles.col3]}>{item.date}</Text>
      <Text style={[styles.cell, styles.col4]}>{item.userEmail || "—"}</Text>
      <Text style={[styles.cell, styles.col5]}>{item.userPhone || "—"}</Text>
      <Text
        style={[
          styles.cell,
          styles.col6,
          {
            color:
              item.status === "paid"
                ? "#4CAF50"
                : item.status === "pending"
                ? "#FFC107"
                : "#FF3D00",
          },
        ]}
      >
        {item.status}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ShopOwnerHeader openMenu={openMenu} title="Bookings" />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* FILTERS */}
          <View style={styles.filterContainer}>
            <View style={styles.filterBox}>
              <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
              <Picker
                selectedValue={selectedBarber}
                style={styles.picker}
                onValueChange={(v) => {
                  setSelectedBarber(v);
                  applyFilters(v, selectedDate);
                }}
              >
                <Picker.Item label="All Barbers" value="all" />
                {barbers.map((b) => <Picker.Item key={b.id} label={b.name} value={b.id} />)}
              </Picker>
            </View>

            <TouchableOpacity style={styles.filterBox} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={22} color={colors.primary} />
              <Text style={styles.filterDateText}>
                {selectedDate ? selectedDate.toDateString() : "Select Date"}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              onChange={(e, d) => {
                setShowDatePicker(false);
                if (d) {
                  setSelectedDate(d);
                  applyFilters(selectedBarber, d);
                }
              }}
            />
          )}

          {/* TABLE */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* HEADER */}
              <View style={styles.headerRow}>
                <Text style={[styles.headerCell, styles.col1]}>Barber</Text>
                <Text style={[styles.headerCell, styles.col2]}>Slot Time</Text>
                <Text style={[styles.headerCell, styles.col3]}>Date</Text>
                <Text style={[styles.headerCell, styles.col4]}>User Email</Text>
                <Text style={[styles.headerCell, styles.col5]}>Phone</Text>
                <Text style={[styles.headerCell, styles.col6]}>Status</Text>
              </View>

              <FlatList
                data={filteredBookings}
                renderItem={renderBooking}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 140 }}
              />
            </View>
          </ScrollView>
        </>
      )}

      <ShopOwnerBottomNav />
      <LeftMenu visible={menuVisible} slide={slide} closeMenu={closeMenu} />
    </View>
  );
}

const COLUMN_WIDTHS = {
  col1: 140,
  col2: 120,
  col3: 120,
  col4: 200,
  col5: 120,
  col6: 120,
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#101010",
  },
  filterBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 0.48,
    height: 44,
  },
  picker: {
    flex: 1,
    color: "#fff",
    marginLeft: 6,
  },
  filterDateText: {
    color: "#fff",
    marginLeft: 8,
  },

  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderColor: "#333",
  },
  headerCell: {
    color: "#000",
    fontWeight: "800",
    paddingVertical: 12,
    textAlign: "center",
    fontSize: 14,
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#222",
  },
  rowEven: { backgroundColor: "#111" },
  rowOdd: { backgroundColor: "#181818" },

  cell: {
    color: "#fff",
    paddingVertical: 10,
    textAlign: "center",
    fontSize: 13,
  },

  col1: { width: COLUMN_WIDTHS.col1 },
  col2: { width: COLUMN_WIDTHS.col2 },
  col3: { width: COLUMN_WIDTHS.col3 },
  col4: { width: COLUMN_WIDTHS.col4 },
  col5: { width: COLUMN_WIDTHS.col5 },
  col6: { width: COLUMN_WIDTHS.col6 },
});
