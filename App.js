import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import GlobalLayout from "./global-layout";
import { TRELLO_API_KEY } from "@env";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import LottieView from "lottie-react-native";

const CustomComponent = ({ title, onPress, textColor }) => (
  <View style={styles.customComponent}>
    <TouchableOpacity onPress={onPress}>
      <Text style={{ color: textColor, fontSize: 20 }}>{title}</Text>
    </TouchableOpacity>
  </View>
);

const App = () => {
  const [token, setToken] = useState("");
  const [showGlobalLayout, setShowGlobalLayout] = useState(false);
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#1C1C1C" : "#Dcdede";
  const textColor = colorScheme === "dark" ? "white" : "black";
  const animationpath =
    colorScheme === "dark"
      ? require("./assets/animation-dark.json")
      : require("./assets/animation-light.json");
  useEffect(() => {
    async function checkToken() {
      const trello_token = await SecureStore.getItemAsync("trello_token");
      if (trello_token) {
        setToken(trello_token);
        setShowGlobalLayout(true);
      }
    }
    checkToken();
  }, []);

  async function openLink() {
    // Generate a redirect URL
    const redirectUrl = Linking.createURL("");
    console.log("redirectUrl:", redirectUrl); // Debug log

    // Open the auth session
    let result = await WebBrowser.openAuthSessionAsync(
      `https://trello.com/1/authorize?expiration=30days&name=MyPersonalToken&scope=read,write,account&response_type=token&key=${TRELLO_API_KEY}&return_url=${redirectUrl}`,
      redirectUrl
    );

    console.log("result:", result); // Debug log

    if (result.type === "success") {
      // Extract the token from the URL
      let token = new URL(result.url).hash.split("=")[1];
      console.log(token);
      setToken(token);
      SecureStore.setItemAsync("trello_token", token);
      setShowGlobalLayout(true);
    }
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={[
            styles.container,
            { backgroundColor, paddingTop: StatusBar.currentHeight },
          ]}
        >
          <LottieView
            source={animationpath}
            autoPlay
            loop
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            }}
          />
          <StatusBar translucent backgroundColor="transparent" />
          {showGlobalLayout ? (
            <GlobalLayout setShowGlobalLayout={setShowGlobalLayout} />
          ) : (
            <CustomComponent
              title="Login"
              onPress={openLink}
              textColor={textColor}
            />
          )}
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  customComponent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#9300FF",
    borderRadius: 10,
    width: 100,
    height: 50,
  },
});

export default App;
