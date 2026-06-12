import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useProducts } from "@/lib/app-queries";
import { useCart } from "@/lib/cart";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { PremiumHeader } from "@/components/native/premium-header";
import { ArrowLeft, ShoppingCart, Sparkles, Check } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';

export default function Marketplace() {
  const router = useRouter();
  const { data: products, isLoading, refetch } = useProducts();
  const cart = useCart();
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const handleAdd = (p: any) => {
    cart.add({
      product_id: p.id,
      name: p.name,
      price: p.price,
      qty: 1
    });

    // Set feedback state
    setAddedItems(prev => ({ ...prev, [p.id]: true }));

    // Clear feedback after 2 seconds
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  const isInCart = (productId: string) => {
    return cart.items.some(item => item.product_id === productId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#080c0a' }}>
      <Stack.Screen options={{
        headerShown: true, title: "", headerTransparent: true,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginLeft: 16, height: 40, width: 40, borderRadius: 12, backgroundColor: '#0f1714', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <ArrowLeft size={20} color="#FFF" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push("/market/cart")}
            style={{ marginRight: 16, height: 40, width: 40, backgroundColor: '#0f1714', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <View>
              <ShoppingCart size={20} color="#FFF" />
              {cart.items.length > 0 && (
                <View style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#10b981', width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'black', fontSize: 8, fontWeight: 'bold' }}>{cart.items.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} tintColor="#10B981" onRefresh={refetch} />}
      >
        <View style={{ paddingHorizontal: 24 }}>
          <PremiumHeader title="ClipMarket" subtitle="Premium Supplies" />

          <Card glass style={{ marginBottom: 40, padding: 0, overflow: 'hidden', borderColor: 'rgba(16,185,129,0.2)' }}>
            <LinearGradient colors={['rgba(16, 185, 129, 0.1)', 'transparent']} style={{ padding: 24 }}>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Sparkles size={16} color="#f59e0b" />
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Official Partner Store</Text>
               </View>
               <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 18 }}>Genuine equipment sourced directly for Ghana's master artisans. Use your ClipCredit at checkout.</Text>
            </LinearGradient>
          </Card>

          {isLoading ? (
             <View style={{ paddingVertical: 80, alignItems: 'center' }}><Text style={{ color: '#10b981', fontWeight: '900', letterSpacing: 2 }}>SOURCING PRODUCTS...</Text></View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, paddingBottom: 40 }}>
              {products?.map((p) => {
                const added = addedItems[p.id];
                const inCart = isInCart(p.id);

                return (
                  <View key={p.id} style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
                    <Card style={{ padding: 0, overflow: 'hidden', borderWeight: 1, borderColor: 'rgba(255,255,255,0.05)', height: '100%', backgroundColor: 'rgba(18,26,22,0.4)' }}>
                      <Image
                        source={{ uri: p.image_url || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&q=80" }}
                        style={{ width: '100%', aspectRatio: 1 }}
                        resizeMode="cover"
                      />
                      <View style={{ padding: 16, flex: 1, justifyContent: 'space-between' }}>
                        <View>
                          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }} numberOfLines={2}>{p.name}</Text>
                          <Text style={{ fontFamily: 'Display-Bold', color: '#f59e0b', fontSize: 18, marginTop: 4 }}>GH₵ {p.price}</Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleAdd(p)}
                          activeOpacity={0.8}
                          style={{
                            marginTop: 16,
                            height: 44,
                            borderRadius: 14,
                            backgroundColor: added || inCart ? 'rgba(16, 185, 129, 0.1)' : '#10b981',
                            borderWidth: 1,
                            borderColor: added || inCart ? '#10b981' : 'transparent',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8
                          }}
                        >
                          {added || inCart ? (
                            <>
                              <Check size={16} color="#10b981" />
                              <Text style={{ fontFamily: 'Display-Bold', color: '#10b981', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Added</Text>
                            </>
                          ) : (
                            <Text style={{ fontFamily: 'Display-Bold', color: '#0d1310', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Add to Cart</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </Card>
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
