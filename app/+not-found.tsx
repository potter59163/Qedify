import { useRouter } from "expo-router";
import { View } from "react-native";

import { Icon } from "@/components/icon";
import { C, MONO } from "@/constants/theme";
import { useL } from "@/lib/i18n";
import { href } from "@/lib/nav";
import { Seo } from "@/lib/seo";
import { Text } from "@/lib/text";
import { Btn, Screen } from "@/lib/ui";

export default function NotFound() {
  const router = useRouter();
  const L = useL();
  return (
    <Screen>
      <Seo title={L("Page not found", "ไม่พบหน้านี้")} index={false} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 }}>
        <Icon name="satellite" size={52} color={C.cyan} />
        <Text style={{ fontFamily: MONO, fontSize: 16, color: C.cyan, letterSpacing: 2 }}>{L("SIGNAL LOST", "สัญญาณขาดหาย")}</Text>
        <Text style={{ fontSize: 13, color: C.muted, textAlign: "center" }}>{L("That page drifted out of range.", "หน้านั้นลอยออกนอกระยะสัญญาณไปแล้ว")}</Text>
        <Btn label={L("RETURN TO BASE", "กลับฐาน")} onPress={() => router.replace(href("/"))} icon="home"
          style={{ alignSelf: "stretch", maxWidth: 360, marginTop: 8 }} />
      </View>
    </Screen>
  );
}
