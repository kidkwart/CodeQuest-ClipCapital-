import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, StyleSheet, Dimensions } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useProducts } from "@/lib/app-queries";
import { useCart } from "@/lib/cart";
import { Card } from "@/components/native/card";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, ShoppingCart, Sparkles, Check, ShoppingBag } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyTap } from "@/components/native/bouncy-tap";

// Fallback data in case the database is empty or not connecting
const FALLBACK_PRODUCTS = [
  {
    id: "1",
    name: "Professional Cordless Clipper",
    price: 850,
    image_url: "https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?w=400&q=80",
    description: "High-performance cordless clipper with precision blades."
  },
  {
    id: "2",
    name: "Premium Barber Chair",
    price: 2500,
    image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80",
    description: "Heavy-duty hydraulic barber chair with premium leather."
  },
  {
    id: "3",
    name: "Pro Hair Dryer 2000W",
    price: 450,
    image_url: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&q=80",
    description: "Ionic hair dryer for fast drying and smooth results."
  }
];

export default function Marketplace() {
  const router = useRouter();
  const { data: dbProducts, isLoading, refetch } = useProducts();
  const cart = useCart();
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  // Use DB products if they exist, otherwise use fallbacks
  const products = (dbProducts && dbProducts.length > 0) ? dbProducts : FALLBACK_PRODUCTS;

  const handleAdd = (p: any) => {
    cart.add({
      product_id: p.id,
      name: p.name,
      price: p.price,
      qty: 1
    });

    setLastAddedId(p.id);
    setTimeout(() => setLastAddedId(null), 2000);
  };

  const getItemQty = (productId: string) => {
    const item = cart.items.find(i => i.product_id === productId);
    return item ? item.qty : 0;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)")}
            style={styles.navBtn}
          >
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push("/market/cart")}
            style={styles.navBtn}
          >
            <View>
              <ShoppingCart size={20} color="#FFF" />
              {cart.items.length > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeText}>{cart.items.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor="#10B981" onRefresh={refetch} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="ClipMarket" subtitle="Premium Supplies" />

          {/* Partner Banner */}
          <Card glass style={styles.bannerCard}>
            <LinearGradient colors={['rgba(16, 185, 129, 0.1)', 'transparent']} style={{ padding: 24 }}>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Sparkles size={16} color="#f59e0b" />
                  <Text style={styles.bannerTitle}>Official Partner Store</Text>
               </View>
               <Text style={styles.bannerSub}>Genuine equipment sourced directly for Ghana's master artisans. Use your ClipCredit at checkout.</Text>
            </LinearGradient>
          </Card>

          {isLoading && dbProducts?.length === 0 ? (
             <View style={{ paddingVertical: 80, alignItems: 'center' }}>
                <Text style={{ color: '#10b981', fontWeight: '900', letterSpacing: 2 }}>CONNECTING TO SUPPLY...</Text>
             </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
              {products.map((p) => {
                const qty = getItemQty(p.id);
                const isJustAdded = lastAddedId === p.id;

                return (
                  <View key={p.id} style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
                    <BouncyTap
                      activeOpacity={1}
                      onPress={() => router.push(`/market/${p.id}`)}
                      style={{ flex: 1 }}
                    >
                      <Card style={styles.productCard}>
                        <Image
                          source={{ uri: p.image_url }}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                        <View style={styles.productDetails}>
                          <View>
                            <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                            <Text style={styles.productPrice}>GH₵ {p.price}</Text>
                          </View>

                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleAdd(p);
                            }}
                            activeOpacity={0.7}
                            style={[
                              styles.addBtn,
                              (isJustAdded || qty > 0) && styles.addBtnActive
                            ]}
                          >
                            {isJustAdded ? (
                              <Check size={16} color="#10b981" />
                            ) : qty > 0 ? (
                              <Text style={styles.addBtnTextActive}>In Cart ({qty})</Text>
                            ) : (
                              <Text style={styles.addBtnText}>Add to Cart</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </Card>
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
  navBtn: {
    marginLeft: 16,
    marginRight: 16,
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: '#0f1714',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  badgeCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#10b981',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#080c0a'
  },
  badgeText: {
    color: 'black',
    fontSize: 8,
    fontWeight: 'bold'
  },
  bannerCard: {
    marginBottom: 40,
    padding: 0,
    overflow: 'hidden',
    borderColor: 'rgba(16,185,129,0.2)'
  },
  bannerTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    lineHeight: 18
  },
  productCard: {
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    height: '100%',
    backgroundColor: 'rgba(18,26,22,0.4)',
    borderRadius: 24
  },
  productImage: {
    width: '100%',
    aspectRatio: 1
  },
  productDetails: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between'
  },
  productName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13
  },
  productPrice: {
    fontFamily: 'Display-Bold',
    color: '#f59e0b',
    fontSize: 18,
    marginTop: 4
  },
  addBtn: {
    marginTop: 16,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  addBtnText: {
    fontFamily: 'Display-Bold',
    color: '#0d1310',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  addBtnTextActive: {
    fontFamily: 'Display-Bold',
    color: '#10b981',
    fontSize: 10,
    textTransform: 'uppercase',
  }
});
