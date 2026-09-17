import * as React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { theme } from "../lib/theme";
import { Button } from "./ui";

/**
 * Real device camera. Captured photos stay on the device as local file URIs and are
 * queued for upload — a photo taken underground with no signal is never lost.
 */
export function PhotoCapture({ photos, onChange }: { photos: string[]; onChange: (next: string[]) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [open, setOpen] = React.useState(false);
  const cameraRef = React.useRef<CameraView | null>(null);

  async function take() {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.6 });
    if (photo?.uri) onChange([...photos, photo.uri]);
    setOpen(false);
  }

  if (open && permission?.granted) {
    return (
      <View style={{ height: 380, borderRadius: theme.radius, overflow: "hidden", marginBottom: theme.spacing(2) }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        <View style={{ flexDirection: "row", gap: 8, padding: 8, backgroundColor: theme.colors.card }}>
          <View style={{ flex: 1 }}>
            <Button title="Capture" onPress={take} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Cancel" variant="outline" onPress={() => setOpen(false)} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: theme.spacing(2) }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: theme.colors.text, marginBottom: 6 }}>
        Photo evidence ({photos.length})
      </Text>
      {photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {photos.map((uri) => (
            <Pressable
              key={uri}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              onPress={() => onChange(photos.filter((p) => p !== uri))}
              style={{ marginRight: 8 }}
            >
              <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
              <Text style={{ fontSize: 10, color: theme.colors.muted, textAlign: "center", marginTop: 2 }}>Tap to remove</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <Button
        title="Take photo"
        variant="outline"
        onPress={async () => {
          if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) return;
          }
          setOpen(true);
        }}
      />
      {permission && !permission.granted ? (
        <Text style={{ fontSize: 11, color: theme.colors.muted, marginTop: 6 }}>
          Camera permission is required to attach photo evidence.
        </Text>
      ) : null}
    </View>
  );
}
