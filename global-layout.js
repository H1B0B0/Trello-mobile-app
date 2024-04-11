import React, { useState } from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  StatusBar,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Sidebar from "./components/Sidebar";
import TaskModule from "./components/TaskModule";
import Stages from "./components/stages";
import Icon from "react-native-vector-icons/SimpleLineIcons";
import * as SecureStore from "expo-secure-store";
import { BoardIdContext } from "./contexts/boardID";
import { CardContext } from "./contexts/cards";
import LottieView from "lottie-react-native";
import Workspaces from "./components/workspaces";

const GlobalLayout = ({ setShowGlobalLayout }) => {
  const [currentStage, setCurrentStage] = useState("");
  const colorScheme = useColorScheme();
  const [boardId, setBoardId] = useState([]);
  const [stages, setStages] = useState([]);
  const [stagesId, setStagesId] = useState([]);
  const [workspacesVisibles, setWorkspacesVisibles] = useState(true);
  const [workspace, setWorkspace] = useState("");

  const insets = useSafeAreaInsets();
  const animationpath =
    colorScheme === "dark"
      ? require("./assets/animation-light.json")
      : require("./assets/animation-dark.json");

  const backgroundColor = colorScheme === "dark" ? "#1C1C1C" : "#Dcdede";
  const logoutColor = colorScheme === "dark" ? "#691A14" : "#BE3025";
  const textColor = colorScheme === "dark" ? "white" : "black";

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("trello_token");
    setShowGlobalLayout(false);
  };
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop:
            Platform.OS === "android"
              ? StatusBar.currentHeight * 0.1
              : insets.top,
        },
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" />
      <BoardIdContext.Provider value={{ boardId, setBoardId }}>
        <CardContext.Provider
          value={{
            stages,
            stagesId,
            setStage: setStages,
            setStagesId: setStagesId,
          }}
        >
          {workspacesVisibles ? (
            <View style={{ flex: 1 }}>
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
              <Workspaces
                setWorkspacesVisibles={setWorkspacesVisibles}
                setWorkspace={setWorkspace}
              />
            </View>
          ) : (
            <>
              <Sidebar
                setWorkspacesVisibles={setWorkspacesVisibles}
                workspace={workspace}
              />
              <View style={[styles.mainContent, { backgroundColor }]}>
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
                <View style={styles.stagesContainer}>
                  <View
                    style={[styles.logout, { backgroundColor: logoutColor }]}
                  >
                    <TouchableOpacity onPress={handleLogout}>
                      <Icon
                        name="logout"
                        size={20}
                        style={[{ color: "white" }]}
                      />
                    </TouchableOpacity>
                  </View>
                  <Stages
                    currentStage={currentStage}
                    setCurrentStage={setCurrentStage}
                  />
                </View>
                <TaskModule currentStage={currentStage} />
              </View>
            </>
          )}
        </CardContext.Provider>
      </BoardIdContext.Provider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  stagesContainer: {
    flexDirection: "row",
    margin: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  stageItem: {
    padding: 15,
    flex: 1,
  },
  logout: {
    fontSize: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
});

export default GlobalLayout;
