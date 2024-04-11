import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import { CardContext } from "../contexts/cards";
import { BoardIdContext } from "../contexts/boardID";
import axios from "axios";
import { TRELLO_API_KEY } from "@env";
import * as SecureStore from "expo-secure-store";
import Dialog from "react-native-dialog";

const Stages = ({ currentStage, setCurrentStage, waitFor }) => {
  const [stageIndex, setStageIndex] = useState(0);
  const { stages, setStage } = useContext(CardContext);
  const { stagesId, setStagesId } = useContext(CardContext);
  const { boardId } = useContext(BoardIdContext);
  const [showDialog, setShowDialog] = useState(false);
  const [isAddStageDialogVisible, setIsAddStageDialogVisible] = useState(false);
  const [nameDialog, setNameDialog] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [UpdateStageName, setUpdateStageName] = useState("");
  const colorScheme = useColorScheme();
  const textColor = colorScheme === "dark" ? "white" : "black";
  const backgroundColor = colorScheme === "dark" ? "#424242" : "white";
  const backgroundcontainer = colorScheme === "dark" ? "#253337" : "#9DB5C0";
  const arrowcolor = colorScheme === "dark" ? "#CA56FA" : "#691463";

  const translateX = useSharedValue(0);

  useEffect(() => {
    const fetchBoardData = async () => {
      if (boardId && typeof boardId === "string") {
        const trelloToken = await SecureStore.getItemAsync("trello_token");
        axios
          .get(
            `https://api.trello.com/1/boards/${boardId}/lists?key=${TRELLO_API_KEY}&token=${trelloToken}`
          )
          .then((response) => {
            setStage(
              response.data.map((list) => ({ id: list.id, title: list.name }))
            );
            setStagesId(0);
            setStageIndex(0);
          })
          .catch((error) => {
            console.error("Error fetching board data:", error);
          });
      }
    };
    fetchBoardData();
  }, [boardId]);

  const postNewStage = async (name) => {
    const trelloToken = await SecureStore.getItemAsync("trello_token");
    axios
      .post(
        `https://api.trello.com/1/lists?key=${TRELLO_API_KEY}&token=${trelloToken}`,
        {
          name: name,
          idBoard: boardId,
          pos: "bottom",
        }
      )
      .then((response) => {
        setStage((prevStages) => {
          if (Array.isArray(prevStages)) {
            const newStages = [
              ...prevStages,
              { id: response.data.id, title: name },
            ];
            setStageIndex(newStages.length - 1); // Set current stage index to the last stage
            setCurrentStage(newStages[newStages.length - 1]); // Set current stage to the last stage
            return newStages;
          } else {
            return prevStages;
          }
        });
        console.log("response :", response.data);
        setStagesId(stageIndex + 1);
      })
      .catch((error) => {
        console.error("Error posting new stage:", error);
      });
  };

  const changeStageName = async (stageId) => {
    const newName = UpdateStageName;
    const trelloToken = await SecureStore.getItemAsync("trello_token");
    axios
      .put(
        `https://api.trello.com/1/lists/${stageId}?key=${TRELLO_API_KEY}&token=${trelloToken}`,
        {
          name: newName,
        }
      )
      .then((response) => {
        setStage((prevStages) => {
          if (Array.isArray(prevStages)) {
            return prevStages.map((stage) =>
              stage.id === stageId ? { ...stage, title: newName } : stage
            );
          } else {
            return prevStages;
          }
        });
        console.log("response :", response.data);
      })
      .catch((error) => {
        console.error("Error updating stage name:", error);
      });
  };

  const archiveStage = async (currentStageId) => {
    const trelloToken = await SecureStore.getItemAsync("trello_token");
    axios
      .put(
        `https://api.trello.com/1/lists/${currentStageId}/closed?key=${TRELLO_API_KEY}&token=${trelloToken}`,
        {
          value: true,
        }
      )
      .then((response) => {
        console.log(response.status);
        // Supprimez le stage de la liste des stages
        setStage((prevStages) => {
          if (Array.isArray(prevStages)) {
            const newStages = prevStages.filter(
              (stage) => stage.id !== currentStageId
            );
            // Si le stage supprimé est le dernier, déplacez l'index du stage actuel vers la gauche
            if (stageIndex === newStages.length) {
              setStageIndex(stageIndex - 1);
              setCurrentStage(newStages[stageIndex - 1]);
              setStagesId(stageIndex - 1);
            }
            return newStages;
          } else {
            return prevStages;
          }
        });
      })
      .catch((error) => {
        console.error("Error archiving the stage:", error);
      });
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
    },
    onEnd: (event) => {
      let newIndex = stageIndex;
      if (event.translationX > 40 && stageIndex > 0) {
        newIndex = stageIndex - 1;
      } else if (event.translationX < -40 && stageIndex < stages.length - 1) {
        newIndex = stageIndex + 1;
      }
      runOnJS(setStageIndex)(newIndex);
      runOnJS(setCurrentStage)(stages[newIndex]);
      runOnJS(setStagesId)(newIndex);
      translateX.value = withSpring(0);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity:
      translateX.value < 0
        ? 1 + translateX.value / 100
        : 1 - translateX.value / 100,
  }));

  const handleLeftArrowPress = () => {
    if (stages && stageIndex > 0) {
      setCurrentStage(stages[stageIndex - 1]);
      setStageIndex(stageIndex - 1);
      setStagesId(stageIndex - 1);
      console.log("stageIndex :", stageIndex);
      console.log("stagetitle :", stages[stageIndex - 1]);
    }
  };

  const handleRightArrowPress = () => {
    if (stages && stageIndex < stages.length - 1) {
      setCurrentStage(stages[stageIndex + 1]);
      setStageIndex(stageIndex + 1);
      setStagesId(stageIndex + 1);
      console.log("stageIndex :", stageIndex);
      console.log("stagetitle :", stages[stageIndex + 1]);
    }
  };

  const addNewStage = () => {
    console.log("Visible ? : ", isAddStageDialogVisible);
    setIsAddStageDialogVisible(true);

    console.log("Visible ? : ", isAddStageDialogVisible);
  };

  const handleAddStage = () => {
    if (newStageName) {
      postNewStage(newStageName);
      setNewStageName("");
      setIsAddStageDialogVisible(false);
    }
  };

  const handleLongPress = () => {
    setShowDialog(true);
  };

  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      waitFor={waitFor}
      activeOffsetX={[-10, 10]}
    >
      <Animated.View
        testID="stageContainer"
        style={[
          styles.stagesContainer,
          { backgroundColor: backgroundcontainer },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            flex: 1,
          }}
        >
          {stages && stageIndex > 0 && (
            <Icon
              testID="leftArrow"
              style={[
                styles.stageArrow,
                { color: arrowcolor, borderColor: textColor },
              ]}
              name="keyboard-arrow-left"
              onPress={handleLeftArrowPress}
            />
          )}
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            {stages &&
              stages.map(
                (stage, index) =>
                  index === stageIndex && (
                    <TouchableOpacity
                      onLongPress={handleLongPress}
                      key={index}
                      style={[
                        styles.stageItem,
                        currentStage === stage && styles.activeStage,
                      ]}
                      onPress={() => setCurrentStage(stage)}
                    >
                      <Dialog.Container
                        visible={showDialog}
                        contentStyle={{
                          backgroundColor: backgroundColor,
                          borderRadius: 15,
                        }}
                      >
                        <Dialog.Title>Task Options</Dialog.Title>
                        <Dialog.Description style={{ alignItems: "center" }}>
                          Choose an option
                        </Dialog.Description>
                        <View style={{ flexDirection: "column" }}>
                          <View
                            style={{
                              marginBottom: 10,
                              borderColor: textColor,
                              borderWidth: 1,
                              borderRadius: 10,
                              marginLeft: 10,
                              marginRight: 10,
                              shadowColor: "#000",
                              shadowOffset: {
                                width: 0,
                                height: 2,
                              },
                              shadowOpacity: 0.25,
                              shadowRadius: 3.84,
                              elevation: 5,
                            }}
                          >
                            <Dialog.Button
                              label="Add a stage"
                              style={{ color: textColor }}
                              onPress={() => {
                                setShowDialog(false);
                                setTimeout(() => addNewStage(), 500);
                              }}
                            />
                          </View>
                          <View
                            style={{
                              marginBottom: 10,
                              borderColor: textColor,
                              borderWidth: 1,
                              borderRadius: 10,
                              marginLeft: 10,
                              marginRight: 10,
                            }}
                          >
                            <Dialog.Button
                              label="Change stage name"
                              style={{ color: textColor }}
                              onPress={() => {
                                setShowDialog(false);
                                setTimeout(() => setNameDialog(true), 500);
                              }}
                            />
                          </View>
                          <View
                            style={{
                              marginBottom: 10,
                              borderColor: textColor,
                              borderWidth: 1,
                              borderRadius: 10,
                              marginLeft: 10,
                              marginRight: 10,
                            }}
                          >
                            <Dialog.Button
                              label="Archive the stage"
                              style={{ color: "red" }}
                              onPress={() => {
                                archiveStage(currentStage.id);
                                setShowDialog(false);
                              }}
                            />
                          </View>
                          <View
                            style={{
                              marginBottom: 10,
                              borderColor: textColor,
                              borderWidth: 1,
                              borderRadius: 10,
                              marginLeft: 10,
                              marginRight: 10,
                            }}
                          >
                            <Dialog.Button
                              label="Cancel"
                              style={{ color: "orange" }}
                              onPress={() => {
                                setShowDialog(false);
                              }}
                            />
                          </View>
                        </View>
                      </Dialog.Container>
                      <View
                        style={[
                          styles.stageContent,
                          stageIndex === 0 && styles.withArrowLeft,
                          stageIndex === stages.length - 1 &&
                            styles.withArrowRight,
                        ]}
                      >
                        <Animated.View style={[styles.Stages, animatedStyle]}>
                          <Text
                            style={[
                              styles.currentStage,
                              { color: textColor },
                              stage.title.length > 2000 && { maxWidth: 100 },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {String(stage.title)}
                          </Text>
                        </Animated.View>
                      </View>

                      <Dialog.Container
                        visible={nameDialog}
                        contentStyle={{
                          backgroundColor: backgroundColor,
                          borderRadius: 15,
                        }}
                      >
                        <Dialog.Title style={{ color: textColor }}>
                          Update the Stage
                        </Dialog.Title>
                        <Dialog.Description style={{ color: textColor }}>
                          Enter the new name of the stage
                        </Dialog.Description>
                        <Dialog.Input
                          style={{ color: textColor }}
                          onChangeText={(text) => setUpdateStageName(text)}
                          value={UpdateStageName}
                        />
                        <Dialog.Button
                          label="Cancel"
                          style={{ color: "orange" }}
                          onPress={() => setNameDialog(false)}
                        />
                        <Dialog.Button
                          style={{ color: textColor }}
                          label="ok"
                          onPress={() => {
                            setNameDialog(false);
                            changeStageName(currentStage.id);
                          }}
                        />
                      </Dialog.Container>
                      <Dialog.Container
                        visible={isAddStageDialogVisible}
                        contentStyle={{
                          backgroundColor: backgroundColor,
                          borderRadius: 15,
                        }}
                      >
                        <Dialog.Title style={{ color: textColor }}>
                          New Stage
                        </Dialog.Title>
                        <Dialog.Description style={{ color: textColor }}>
                          Enter the name of the new stage
                        </Dialog.Description>
                        <Dialog.Input
                          style={{ color: textColor }}
                          onChangeText={(text) => setNewStageName(text)}
                          value={newStageName}
                        />
                        <Dialog.Button
                          style={{ color: "orange" }}
                          label="Cancel"
                          onPress={() => setIsAddStageDialogVisible(false)}
                        />
                        <Dialog.Button
                          label="Add"
                          onPress={handleAddStage}
                          style={{ color: textColor }}
                        />
                      </Dialog.Container>
                    </TouchableOpacity>
                  )
              )}
          </View>
          {stages && stageIndex != stages.length - 1 && (
            <Icon
              testID="rightArrow"
              style={[styles.stageArrow, { color: arrowcolor }]}
              name="keyboard-arrow-right"
              onPress={handleRightArrowPress}
            />
          )}
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  stagesContainer: {
    flexDirection: "row",
    margin: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  stageItem: {
    flexShrink: 1,
  },
  withArrowLeft: {
    paddingLeft: 50,
  },
  withArrowRight: {
    paddingRight: 50,
  },
  stageContent: {
    flexDirection: "row",
  },
  stageArrow: {
    fontSize: 35,
    margin: 10,
  },
  currentStage: {
    maxWidth: 150,
    fontSize: 20,
    fontStyle: "italic",
  },
});

export default Stages;
