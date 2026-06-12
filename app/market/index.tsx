import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useProducts } from "@/lib/app-queries";
import { Card } from "@/components/native/card";
import { Button } from "@/components/native/button";
import { ArrowLeft, ShoppingCart, Sparkles, ShieldCheck } from "lucide-react-native";

export default function Marketplace() {
  const router = useRouter();
  const { data: products, isLoading, refetch } = useProducts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{
        headerShown: true,
        title: "ClipMarket",
        headerStyle: { backgroundColor: "#0A0A0A" },
        headerTintColor: "#FFFFFF",
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push("/market/cart")} className="relative">
            <ShoppingCart size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        className="flex-1 px-6 pt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-2xl font-bold text-foreground">Premium Shop</Text>
            <Sparkles size={20} color="#F59E0B" />
          </View>
          <View className="flex-row items-center gap-1.5">
            <ShieldCheck size={14} color="#10B981" />
            <Text className="text-muted-foreground text-xs">Quality Vetted Supplies</Text>
          </View>
        </View>

        {isLoading ? (
          <Text className="text-muted-foreground italic">Loading products...</Text>
        ) : (products ?? []).length === 0 ? (
          <Text className="text-muted-foreground italic text-center">No products available</Text>
        ) : (
          <View className="flex-row flex-wrap -mx-2 pb-20">
            {products?.map((p) => (
              <View key={p.id} className="w-1/2 px-2 mb-4">
                <Card className="p-0 overflow-hidden border-border/30 h-full">
                  <Image
                    source={{ uri: p.image_url || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&q=80" }}
                    className="w-full aspect-[4/3]"
                    resizeMode="cover"
                  />
                  <View className="p-3 justify-between flex-1">
                    <View>
                      <Text className="text-foreground font-bold text-sm leading-tight" numberOfLines={2}>{p.name}</Text>
                      <Text className="text-gold font-black mt-1">GH₵ {p.price}</Text>
                    </View>
                    <Button
                      title="Add to Cart"
                      size="sm"
                      className="mt-3 h-9 rounded-lg"
                      onPress={() => alert(`${p.name} added!`)}
                    />
                  </View>
                </Card>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
