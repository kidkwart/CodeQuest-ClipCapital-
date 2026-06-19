import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, StyleSheet, Dimensions, ActivityIndicator, TextInput, Vibration, Platform } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useProducts, useProfile } from "@/lib/app-queries";
import { useCart } from "@/lib/cart";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, ShoppingCart, Sparkles, Check, ShoppingBag, Star, Zap, ChevronRight, Search, X, ClipboardList } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";
import { useTheme } from "@/context/theme-context";

const { width } = Dimensions.get('window');

// Verified professional imagery for master barbers
export const FALLBACK_PRODUCTS = [
  {
    id: "prod_1",
    name: "Wahl Cordless Magic Clip",
    price: 550,
    image_url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=800",
    description: "The 'Gold Standard' for Ghanaian master barbers. Features the iconic stagger-tooth blade for the ultimate seamless fade and precision tapering.",
    category: "Clippers"
  },
  {
    id: "prod_2",
    name: "Premium Beard Growth Oil",
    price: 50,
    image_url: "https://images.unsplash.com/photo-1626285493125-9653842f1f0a?auto=format&fit=crop&q=80&w=800",
    description: "Artisan-crafted beard oil with Cedarwood and Sandalwood. Softens coarse hair and eliminates itch for a well-maintained, healthy look.",
    category: "Oils"
  },
  {
    id: "prod_3",
    name: "Vintage Gold Barber Chair",
    price: 12000,
    image_url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800",
    description: "Heavy-duty hydraulic pump with 360-degree rotation and adjustable recline. Hand-stitched premium leather for maximum client comfort and shop aesthetics.",
    category: "Chairs"
  },
  {
    id: "prod_4",
    name: "Proraso Shaving Cream",
    price: 80,
    image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800",
    description: "Traditional Italian formula enriched with Eucalyptus and Menthol. Provides a rich, cooling lather for the smoothest possible professional shave.",
    category: "Grooming"
  },
  {
    id: "prod_5",
    name: "Dyson Supersonic™ Pro",
    price: 3500,
    image_url: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&q=80&w=800",
    description: "Intelligent heat control to protect natural shine. Engineered for professional stylists with ultra-fast drying and quiet high-torque motor.",
    category: "Tools"
  },
  {
    id: "prod_6",
    name: "Andis Master Cordless Gold",
    price: 4200,
    image_url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=800",
    description: "The legendary high-speed motor now in a cordless body. Unbreakable gold-plated aluminum housing for durability and classic professional style.",
    category: "Clippers"
  }
];

export default function Marketplace() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { data: dbProducts, isLoading, refetch } = useProducts();
  const { data: profile } = useProfile();
  const cart = useCart();
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const allProducts = (dbProducts && dbProducts.length > 0) ? dbProducts : FALLBACK_PRODUCTS;
  const isPrivate = profile?.privacy_mode_enabled ?? false;

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = (p: any) => {
    cart.add({ product_id: p.id, name: p.name, price: p.price, qty: 1 });
    setLastAddedId(p.id);
    Vibration.vibrate(Platform.OS === 'ios' ? 0 : 10);
    setTimeout(() => setLastAddedId(null), 2000);
  };

  const getItemQty = (productId: string) => {
    const item = cart.items.find(i => i.product_id === productId);
    return item ? item.qty : 0;
  };

  const totalItems = cart.items.reduce((s, i) => s + i.qty, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <BouncyTap onPress={() => router.push("/(tabs)")} style={[styles.navBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <ArrowLeft size={20} color={colors.text} />
          </BouncyTap>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 12, marginRight: 16 }}>
             <BouncyTap onPress={() => router.push("/market/orders")} style={[styles.navBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <ClipboardList size={20} color={colors.primary} />
             </BouncyTap>
             <BouncyTap onPress={() => router.push("/market/cart")} style={[styles.navBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View>
                  <ShoppingCart size={20} color={colors.text} />
                  {totalItems > 0 && (
                    <View style={styles.badgeCount}>
                      <Text style={styles.badgeText}>{totalItems}</Text>
                    </View>
                  )}
                </View>
             </BouncyTap>
          </View>
        )
      }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor={colors.primary} onRefresh={refetch} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          {/* Elite Header */}
          <View style={styles.headerSection}>
            <Text style={[styles.supTitle, { color: colors.primary }]}>CLIPCAPITAL PREMIUM</Text>
            <View style={styles.titleRow}>
               <Text style={[styles.mainTitle, { color: colors.text }]}>Marketplace</Text>
               <View style={[styles.verifiedTag, { backgroundColor: colors.primary }]}>
                  <Star size={10} color="#000" fill="#000" />
                  <Text style={styles.verifiedText}>OFFICIAL</Text>
               </View>
            </View>
            <Text style={[styles.subTitle, { color: colors.textMuted }]}>Authorized professional equipment supply chain.</Text>
          </View>

          {/* Functional Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
             <Search size={18} color={searchQuery ? colors.primary : colors.textDim} />
             <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search for tools, furniture..."
                placeholderTextColor={colors.textDim}
                value={searchQuery}
                onChangeText={setSearchQuery}
                selectionColor={colors.primary}
             />
             {searchQuery.length > 0 && (
               <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={18} color={colors.textDim} />
               </TouchableOpacity>
             )}
          </View>

          {/* Institutional Credit Card Banner */}
          <BouncyTap onPress={() => router.push("/(tabs)/loans")}>
            <LinearGradient
                colors={['#10b981', '#064e3b']}
                style={styles.creditBanner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
               <View style={styles.bannerPattern} />
               <View style={styles.bannerContent}>
                  <View style={styles.bannerHeader}>
                     <Text style={styles.bannerLabel}>OXYGEN CREDIT LINE</Text>
                     <Zap size={16} color="white" fill="white" />
                  </View>
                  <Text style={styles.bannerMain}>Scale Your Business</Text>
                  <Text style={styles.bannerDesc}>Use your ClipScore to unlock interest-free equipment financing. Pay as you earn.</Text>
                  <View style={styles.bannerFooter}>
                     <Text style={styles.bannerLink}>VIEW LIMIT</Text>
                     <ChevronRight size={14} color="white" />
                  </View>
               </View>
            </LinearGradient>
          </BouncyTap>

          <View style={styles.sectionDivider}>
             <Text style={[styles.sectionTitle, { color: colors.textDim }]}>CURATED FOR MASTER BARBERS</Text>
             <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {isLoading && (!dbProducts || dbProducts.length === 0) ? (
             <View style={styles.loader}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loaderText, { color: colors.primary }]}>SYNCING INVENTORY...</Text>
             </View>
          ) : filteredProducts.length === 0 ? (
             <View style={styles.emptyState}>
                <Search size={40} color={colors.surfaceElevated} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No matches found for "{searchQuery}"</Text>
             </View>
          ) : (
            <View style={styles.grid}>
              {filteredProducts.map((p) => {
                const qty = getItemQty(p.id);
                const isJustAdded = lastAddedId === p.id;

                return (
                  <View key={p.id} style={styles.productWrapper}>
                    <BouncyTap
                      activeOpacity={1}
                      onPress={() => router.push(`/market/${p.id}`)}
                      style={{ flex: 1 }}
                    >
                      <View style={[styles.productCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                        <View style={[styles.imageContainer, { backgroundColor: colors.surfaceElevated }]}>
                           <Image source={{ uri: p.image_url }} style={styles.productImage} />
                           <LinearGradient
                             colors={theme === 'dark' ? ['transparent', 'rgba(8, 12, 10, 0.8)'] : ['transparent', 'rgba(255, 255, 255, 0.6)']}
                             style={styles.imageOverlay}
                           />
                           <View style={[styles.catBadge, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)', borderColor: colors.border }]}>
                              <Text style={[styles.catText, { color: colors.text }]}>{p.category?.toUpperCase()}</Text>
                           </View>
                        </View>

                        <View style={styles.productInfo}>
                          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{p.name}</Text>
                          <Text style={[styles.productPrice, { color: colors.gold }]}>
                            {isPrivate ? "••••••" : `GH₵ ${p.price.toLocaleString()}`}
                          </Text>

                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleAdd(p);
                            }}
                            activeOpacity={0.8}
                            style={[styles.buyBtn, { backgroundColor: colors.gold }, (isJustAdded || qty > 0) && { backgroundColor: colors.gold + '10', borderWidth: 1, borderColor: colors.gold }]}
                          >
                            {isJustAdded ? (
                              <Check size={18} color={colors.gold} />
                            ) : qty > 0 ? (
                              <Text style={[styles.buyBtnTextActive, { color: colors.gold }]}>IN CART ({qty})</Text>
                            ) : (
                              <View style={styles.btnRow}>
                                <ShoppingBag size={14} color="#000" strokeWidth={2.5} />
                                <Text style={[styles.buyBtnText, { color: '#0d1310' }]}>BUY NOW</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </BouncyTap>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c0a' },
  scrollContent: { paddingTop: 100, paddingBottom: 80 },
  navBtn: { height: 44, width: 44, borderRadius: 14, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  badgeCount: { position: 'absolute', top: -5, right: -5, backgroundColor: '#10b981', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#080c0a' },
  badgeText: { color: 'black', fontSize: 8, fontWeight: 'bold' },
  headerSection: { marginBottom: 24 },
  supTitle: { color: '#10b981', fontWeight: '900', fontSize: 10, letterSpacing: 4, marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  mainTitle: { fontFamily: 'Display-Bold', color: 'white', fontSize: 32 },
  verifiedTag: { backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { color: '#000', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  subTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1714', paddingHorizontal: 16, borderRadius: 16, gap: 12, marginBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', height: 56 },
  searchInput: { color: 'white', fontSize: 14, fontWeight: '500', flex: 1, height: '100%' },
  creditBanner: { borderRadius: 28, overflow: 'hidden', marginBottom: 40, height: 180 },
  bannerPattern: { position: 'absolute', right: -40, top: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)' },
  bannerContent: { padding: 24, flex: 1, justifyContent: 'space-between' },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerLabel: { color: 'rgba(255,255,255,0.7)', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  bannerMain: { color: 'white', fontFamily: 'Display-Bold', fontSize: 22 },
  bannerDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 16, maxWidth: '80%' },
  bannerFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bannerLink: { color: 'white', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  sectionTitle: { color: '#405045', fontWeight: '900', fontSize: 9, letterSpacing: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  loader: { paddingVertical: 100, alignItems: 'center', gap: 16 },
  loaderText: { color: '#10b981', fontWeight: '900', letterSpacing: 3, fontSize: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -10 },
  productWrapper: { width: '50%', paddingHorizontal: 10, marginBottom: 20 },
  productCard: { backgroundColor: '#0f1714', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  imageContainer: { width: '100%', aspectRatio: 0.9, backgroundColor: '#1a211e' },
  productImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' },
  catBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  catText: { color: 'white', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  productInfo: { padding: 16 },
  productName: { color: '#fcfcfc', fontWeight: '700', fontSize: 12, lineHeight: 18, marginBottom: 8, height: 36 },
  productPrice: { fontFamily: 'Display-Bold', color: '#10b981', fontSize: 18, marginBottom: 16 },
  buyBtn: { height: 44, borderRadius: 14, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  buyBtnActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: '#10b981' },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buyBtnText: { fontFamily: 'Display-Bold', color: '#0d1310', fontSize: 11, letterSpacing: 1 },
  buyBtnTextActive: { fontFamily: 'Display-Bold', color: '#10b981', fontSize: 10 },
  emptyState: { paddingVertical: 80, alignItems: 'center', opacity: 0.3 },
  emptyText: { color: 'white', fontWeight: 'bold', marginTop: 16 }
});
