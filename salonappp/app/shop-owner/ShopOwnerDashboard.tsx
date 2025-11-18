// app/shop-owner/ShopOwnerDashboard.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../src/firebase/firebaseConfig";

import ShopOwnerHeader from "./ShopOwnerHeader";
import ShopOwnerBottomNav from "./ShopOwnerBottomNav";
import LeftMenu from "./LeftMenu";
import { colors } from "../../styles/theme";

type BarberSummary = {
  barberId: string;
  barberName: string;
  bookings: number;
  revenue: number;
};

export default function ShopOwnerDashboard() {
  const [visible, setVisible] = useState(false);
  const slide = useRef(new Animated.Value(-270)).current;

  const openMenu = () => {
    setVisible(true);
    Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: false }).start();
  };
  const closeMenu = () => {
    Animated.timing(slide, { toValue: -270, duration: 220, useNativeDriver: false }).start(() =>
      setVisible(false)
    );
  };

  const [loading, setLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);

  const [counts, setCounts] = useState({ barbers: 0, bookings: 0 });
  const [revenue, setRevenue] = useState({ today: 0, month: 0, year: 0 });
  const [filter, setFilter] = useState<"today" | "month" | "year">("today");

  const [barberSummaries, setBarberSummaries] = useState<BarberSummary[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem("shopId");
      if (!id) return setLoading(false);
      setSalonId(id);
      console.log("SALON_ID:", id);
    })();
  }, []);

  useEffect(() => {
    if (!salonId) return;
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [salonId]);

  useEffect(() => {
    if (!salonId) return;
    calculateRevenue();
  }, [filter]);

  async function loadAll() {
    await Promise.all([loadCounts(), calculateRevenue(), loadBarberSummaries()]);
  }

  /* ----------------------- COUNTS ----------------------- */
  async function loadCounts() {
    const qBarbers = query(collection(db, "barbers"), where("salonId", "==", salonId));
    const qBookings = query(collection(db, "userBookings"), where("salonId", "==", salonId));

    const [barberSnap, bookingSnap] = await Promise.all([
      getDocs(qBarbers),
      getDocs(qBookings),
    ]);

    setCounts({
      barbers: barberSnap.size,
      bookings: bookingSnap.size,
    });
  }

  /* ----------------------- REVENUE ----------------------- */
  function parseDate(v: any): Date | null {
    if (!v) return null;
    if (typeof v === "string") return new Date(v);
    if (v?.toDate) return v.toDate();
    return new Date(v);
  }

  async function calculateRevenue() {
    const snap = await getDocs(
      query(collection(db, "userBookings"), where("salonId", "==", salonId))
    );

    const now = new Date();
    let today = 0,
      month = 0,
      year = 0;

    snap.forEach((d) => {
      const data: any = d.data();
      const amount = Number(data.amount ?? data.price ?? 0) || 0;
      const dt = parseDate(data.date ?? data.createdAt);
      if (!dt) return;

      if (
        dt.getDate() === now.getDate() &&
        dt.getMonth() === now.getMonth() &&
        dt.getFullYear() === now.getFullYear()
      )
        today += amount;

      if (dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear())
        month += amount;

      if (dt.getFullYear() === now.getFullYear()) year += amount;
    });

    setRevenue({ today, month, year });
  }

  /* ----------------------- BARBER SUMMARY ----------------------- */
  async function loadBarberSummaries() {
    try {
      // 1️⃣ Load barbers belonging to this salon
      const barberSnap = await getDocs(
        query(collection(db, "barbers"), where("salonId", "==", salonId))
      );

      const barbers: { id: string; name: string }[] = [];
      barberSnap.forEach((d) => {
        const dat: any = d.data();
        barbers.push({ id: d.id, name: dat.name || "Barber" });
      });

      const validIDs = new Set(barbers.map((b) => b.id));

      // 2️⃣ Load all bookings of this salon
      const bookingSnap = await getDocs(
        query(collection(db, "userBookings"), where("salonId", "==", salonId))
      );

      const map: Record<string, { count: number; revenue: number }> = {};

      bookingSnap.forEach((d) => {
        const data: any = d.data();

        let bId = data.barberId?.trim();
        if (!bId) return;

        if (!validIDs.has(bId)) return; // Prevent mixing wrong barbers

        const amount = Number(data.amount ?? 0) || 0;

        if (!map[bId]) map[bId] = { count: 0, revenue: 0 };
        map[bId].count++;
        map[bId].revenue += amount;
      });

      // 3️⃣ Prepare final UI list
      const summary = barbers.map((b) => ({
        barberId: b.id,
        barberName: b.name,
        bookings: map[b.id]?.count || 0,
        revenue: map[b.id]?.revenue || 0,
      }));

      setBarberSummaries(summary);
    } catch (err) {
      console.warn("Barber Summary Error:", err);
    }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const StatCard = ({ title, value }: any) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={{ flex: 1 }}>
      <ShopOwnerHeader openMenu={openMenu} />

      <ScrollView style={styles.container}>
        {/* TOP CARDS */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <StatCard title="Barbers" value={counts.barbers} />
          <StatCard title="Bookings" value={counts.bookings} />
        </View>

        {/* REVENUE CARD */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueTitle}>Revenue</Text>
          <Text style={styles.revenueValue}>
            {filter === "today"
              ? `₹${revenue.today}`
              : filter === "month"
              ? `₹${revenue.month}`
              : `₹${revenue.year}`}
          </Text>

          <View style={styles.filterWrapper}>
            {(["today", "month", "year"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f === "today" ? "Today" : f === "month" ? "This Month" : "This Year"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* BARBER PERFORMANCE */}
        <Text style={styles.sectionTitle}>Barber Booking Summary</Text>

        {barberSummaries.map((b) => {
          const isOpen = expanded[b.barberId];

          return (
            <View key={b.barberId} style={styles.barberCard}>
              <TouchableOpacity style={styles.barberRow} onPress={() => toggleExpand(b.barberId)}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700" }}>{b.barberName}</Text>
                  <Text style={{ color: "#666", marginTop: 4 }}>{b.bookings} bookings</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontWeight: "800", color: colors.primary }}>₹{b.revenue}</Text>
                  <Text style={{ marginTop: 8, color: "#777" }}>{isOpen ? "▲" : "▼"}</Text>
                </View>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.barberDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bookings</Text>
                    <Text style={styles.detailValue}>{b.bookings}</Text>
                  </View>

                  <View style={[styles.detailRow, { marginTop: 8 }]}>
                    <Text style={styles.detailLabel}>Revenue</Text>
                    <Text style={styles.detailValue}>₹{b.revenue}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <ShopOwnerBottomNav />
      <LeftMenu visible={visible} slide={slide} closeMenu={closeMenu} />
    </View>
  );
}

/* ----------------------- STYLES ----------------------- */

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  container: { flex: 1, padding: 16, paddingBottom: 90 },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    margin: 6,
    elevation: 2,
  },
  statTitle: { color: "#777", fontSize: 13, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.primary },

  revenueCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    elevation: 3,
  },
  revenueTitle: { fontSize: 16, fontWeight: "700", color: "#444" },
  revenueValue: { fontSize: 30, fontWeight: "900", color: colors.primary, marginTop: 8 },

  filterWrapper: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  filterChip: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { textAlign: "center", fontWeight: "700", color: "#444" },
  filterTextActive: { color: "#fff" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 8,
  },

  barberCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    overflow: "hidden",
  },

  barberRow: {
    flexDirection: "row",
    padding: 14,
    justifyContent: "space-between",
    alignItems: "center",
  },

  barberDetails: { padding: 14, backgroundColor: "#f7f7f7" },

  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { color: "#666" },
  detailValue: { fontSize: 16, fontWeight: "900" },
});
