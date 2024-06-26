import React, { useContext, useState, useEffect } from "react";
import {
  Alert,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  View,
  useColorScheme,
  FlatList,
  ImageBackground,
  Platform,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import axios from "axios";
import { TRELLO_API_KEY } from "@env";
import * as SecureStore from "expo-secure-store";
import { CardContext } from "../contexts/cards";
import Dialog from "react-native-dialog";
import RNPickerSelect from "react-native-picker-select";
import { BoardIdContext } from "../contexts/boardID";

const colorMap = {
  green: "#00C853",
  yellow: "#FFEB3B",
  orange: "#FF9800",
  red: "#F44336",
  purple: "#9C27B0",
  sky: "#03A9F4",
  blue: "#2962FF",
  pink_dark: "#E91E63",
  black: "#212121",
  pink: "#FF4081",
  lime: "#C6FF00",
  green_dark: "#1B5E20",
  yellow_dark: "#FDD835",
  orange_dark: "#EF6C00",
  red_dark: "#B71C1C",
  purple_dark: "#4A148C",
  blue_dark: "#0D47A1",
  sky_dark: "#01579B",
  lime_dark: "#76FF03",
  black_dark: "#424242",
  green_light: "#B9F6CA",
  yellow_light: "#FFF9C4",
  orange_light: "#FFE0B2",
  red_light: "#FFCDD2",
  purple_light: "#E1BEE7",
  blue_light: "#BBDEFB",
  sky_light: "#B3E5FC",
  lime_light: "#F4FF81",
  pink_light: "#F8BBD0",
  black_light: "#757575",
};

const moveTaskToStage = async (
  taskId,
  stageId,
  tasks,
  setTasks,
  stages,
  setIsUpdating
) => {
  setIsUpdating(true);
  // Get the Trello token
  const trelloToken = await SecureStore.getItemAsync("trello_token");

  // Update the task in the local state
  setTasks((prevTasks) => {
    // Find the task by its id
    const task = prevTasks
      .flatMap((taskData) => taskData.tasks)
      .find((task) => task.id === taskId);

    return prevTasks.map((taskData) => {
      if (taskData.stageId === stageId) {
        // Add the moved task to the new stage
        return {
          ...taskData,
          tasks: [...taskData.tasks, task],
        };
      } else if (taskData.tasks.some((task) => task.id === taskId)) {
        // Remove the moved task from the old stage
        return {
          ...taskData,
          tasks: taskData.tasks.filter((task) => task.id !== taskId),
        };
      } else {
        return taskData;
      }
    });
  });

  // Update the task in Trello
  axios
    .put(
      `https://api.trello.com/1/cards/${taskId}?key=${TRELLO_API_KEY}&token=${trelloToken}`,
      {
        idList: stageId,
      }
    )
    .then(async (response) => {
      setIsUpdating(false);
      // Fetch the updated tasks
    })
    .catch((error) => {
      console.error("Error updating task:", error);
      Alert.alert("Error updating task", "Please try again later.");
      setIsUpdating(false);
    });
};

export const TaskItem = ({
  item,
  waitFor,
  tasks,
  setTasks,
  stages,
  setIsUpdating,
  isExpanded,
  handlePress,
  setIsExpanded,
  memberDetails,
  setMembersDetails,
}) => {
  const translateX = useSharedValue(0);
  const { stagesId, setStagesId } = useContext(CardContext);
  let newStageId = "";
  const nextStageIndex = stagesId + 1;
  const prevStageIndex = stagesId - 1;
  const [selectedColor, setSelectedColor] = useState(null);
  const colorOptions = Object.entries(colorMap);
  const [showDialog, setShowDialog] = useState(false);
  const appliedLabels = item.labels
    ? item.labels.map((label) => label.color)
    : [];
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [username, setUsername] = useState("");
  const [choicedialogVisible, setchoiceDialogVisible] = useState(false);
  const [memberVisible, setMemberVisible] = useState(false);
  const colorScheme = useColorScheme();
  const { boardId, setBoardId } = useContext(BoardIdContext);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const backgroundColor = colorScheme === "dark" ? "#1C1C1C" : "#Dcdede";
  const textColor = colorScheme === "dark" ? "white" : "black";
  const backgroundCards = colorScheme === "dark" ? "#253337" : "#9DB5C0";
  const green = colorScheme === "dark" ? "#386914" : "#66be25";
  const red = colorScheme === "dark" ? "#691a14" : "#be3025";

  const assignColor = async () => {
    const trelloToken = await SecureStore.getItemAsync("trello_token");
    console.log(selectedColor);

    // Update the task in Trello
    axios
      .post(
        `https://api.trello.com/1/cards/${item.id}/labels?color=${selectedColor}&key=${TRELLO_API_KEY}&token=${trelloToken}`
      )
      .then(() => {
        console.log("Labels assigned successfully");
        setShowDialog(false); // Hide the dialog
      })
      .catch((error) => {
        console.error("Error assigning Labels:", error);
        Alert.alert("Error assigning Labels", "Please try again later.");
        setShowDialog(false); // Hide the dialog
      });
  };

  const assignToMember = async (taskId, memberId) => {
    const trelloToken = await SecureStore.getItemAsync("trello_token");

    // Add a member to the task in Trello
    try {
      await axios.post(
        `https://api.trello.com/1/cards/${taskId}/idMembers?value=${memberId}&key=${TRELLO_API_KEY}&token=${trelloToken}`
      );
    } catch (error) {
      console.error("Error adding member:", error);
      Alert.alert("Error adding member", "Please try again later.");
    }
  };

  const deleteTask = async (taskId) => {
    setIsUpdating(true);

    const trelloToken = await SecureStore.getItemAsync("trello_token");

    // Delete the task in Trello
    axios
      .delete(
        `https://api.trello.com/1/cards/${taskId}?key=${TRELLO_API_KEY}&token=${trelloToken}`
      )
      .then(() => {
        console.log("Task deleted successfully");

        // Delete the task from the local state
        setTasks((prevTasks) => {
          return prevTasks.map((taskData) => {
            if (taskData.tasks.some((task) => task.id === taskId)) {
              // Remove the deleted task
              return {
                ...taskData,
                tasks: taskData.tasks.filter((task) => task.id !== taskId),
              };
            } else {
              return taskData;
            }
          });
        });
        setIsUpdating(false);
      })
      .catch((error) => {
        console.error("Error deleting task:", error);
        Alert.alert("Error deleting task", "Please try again later.");
        setIsUpdating(false);
      });
  };

  const handleokchangetask = async () => {
    const trelloToken = await SecureStore.getItemAsync("trello_token");

    // Update the task locally
    setTasks((prevTasks) => {
      return prevTasks.map((taskData) => {
        if (taskData.tasks.some((task) => task.id === item.id)) {
          // Update the task title
          return {
            ...taskData,
            tasks: taskData.tasks.map((task) =>
              task.id === item.id ? { ...task, title: newTitle } : task
            ),
          };
        } else {
          return taskData;
        }
      });
    });
    setDialogVisible(false);

    // Update the task in Trello
    axios
      .put(
        `https://api.trello.com/1/cards/${item.id}?key=${TRELLO_API_KEY}&token=${trelloToken}`,
        {
          name: newTitle,
        }
      )
      .then(() => {
        console.log("Task updated successfully");
      })
      .catch((error) => {
        console.error("Error updating task:", error);
        Alert.alert("Error updating task", "Please try again later.");
      });
  };

  const changetask = () => {
    setDialogVisible(true);
    setchoiceDialogVisible(false);
  };

  const handleLongPress = () => {
    setchoiceDialogVisible(true);
  };

  const assignLabels = () => {
    setShowDialog(true);
  };

  const handleCancelchangetask = () => {
    setDialogVisible(false);
  };

  const handlememeberpressed = async () => {
    setMemberVisible(true);

    const trelloToken = await SecureStore.getItemAsync("trello_token");

    // Fetch the members from Trello
    axios
      .get(
        `https://api.trello.com/1/boards/${boardId}/members?key=${TRELLO_API_KEY}&token=${trelloToken}`
      )
      .then((response) => {
        const fetchedMembers = response.data;
        setMembers(fetchedMembers);
      })
      .catch((error) => {
        console.error("Error fetching members:", error);
        Alert.alert("Error fetching members", "Please try again later.");
      });
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      if (
        (event.translationX > 0 && nextStageIndex < stages.length) ||
        (event.translationX < 0 && prevStageIndex >= 0)
      ) {
        translateX.value = ctx.startX + event.translationX;
      }
    },
    onEnd: (event) => {
      if (event.translationX > 120 && nextStageIndex < stages.length) {
        newStageId = stages[nextStageIndex].id;
        runOnJS(moveTaskToStage)(
          item.id,
          newStageId,
          tasks,
          setTasks,
          stages,
          setIsUpdating
        );
      } else if (event.translationX < -120 && prevStageIndex >= 0) {
        newStageId = stages[prevStageIndex].id;
        runOnJS(moveTaskToStage)(
          item.id,
          newStageId,
          tasks,
          setTasks,
          stages,
          setIsUpdating
        );
      } else {
        newStageId = "";
      }
      translateX.value = withSpring(0);
    },
  });

  const handleOkPress = async () => {
    const trelloToken = await SecureStore.getItemAsync("trello_token");
    let memberId = "";
    await axios
      .get(
        `https://api.trello.com/1/members/${selectedMember}?key=${TRELLO_API_KEY}&token=${trelloToken}`
      )
      .then((response) => {
        memberId = response.data.id;
        assignToMember(item.id, memberId);
        setMemberVisible(false);
      })
      .catch((error) => {
        console.error("Error getting member id:", error);
        Alert.alert("Error getting member id", "Please try again later.");
      });
  };

  // Rename the function inside the component
  const handleTaskPress = () => {
    if (isExpanded === item.id) {
      setIsExpanded(null); // Si la tâche est déjà étendue, la réduire
    } else {
      setIsExpanded(item.id); // Sinon, étendre la tâche
    }
  };

  const greenOpacity = useAnimatedStyle(() => {
    return {
      opacity: translateX.value > 0 ? translateX.value / 400 : 0,
      borderRadius: 10,
    };
  });

  const redOpacity = useAnimatedStyle(() => {
    return {
      opacity: translateX.value < 0 ? -translateX.value / 400 : 0,
      borderRadius: 10,
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Utilisez le style animé pour le titre dans le rendu
  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      onPress={handleTaskPress}
      testID="task-item"
    >
      <PanGestureHandler
        onGestureEvent={gestureHandler}
        waitFor={waitFor}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.taskItem,
            animatedStyle,
            {
              justifyContent: "center",
              backgroundColor: colorMap[item.cover.color] || backgroundCards,
              shadowColor: textColor,
              borderRadius: 10, // Move borderRadius here
              overflow: "hidden", // Add overflow: 'hidden'
            },
          ]}
        >
          <ImageBackground
            source={{ uri: item.cover.sharedSourceUrl }}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <Animated.View
              style={[
                styles.gradientGreen,
                greenOpacity,
                { backgroundColor: green },
              ]}
            />
            <Animated.View
              style={[styles.gradientRed, redOpacity, { backgroundColor: red }]}
            />
            <Animated.View>
              <Text
                numberOfLines={isExpanded === item.id ? undefined : 1}
                style={{
                  fontSize: 16,
                  color: textColor,
                  marginTop: isExpanded === item.id ? 10 : 0,
                  marginLeft: 10,
                  marginRight: 10,
                }}
              >
                {item.title}
              </Text>
            </Animated.View>
            <Animated.View style={{ padding: isExpanded === item.id ? 10 : 0 }}>
              {isExpanded === item.id && (
                <Animated.View>
                  <Animated.View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexWrap: "wrap",
                      margin: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "bold",
                        color: textColor,
                        marginRight: 5,
                      }}
                    >
                      Labels
                    </Text>
                    {item.labels.map((label, index) => (
                      <Animated.View
                        key={index}
                        style={{
                          backgroundColor: colorMap[label.color],
                          height: 10,
                          width: 30,
                          borderRadius: 10,
                          margin: 4,
                          borderColor: "black",
                          borderWidth: 0.5,
                          shadowColor: "black",
                          shadowOpacity: 0.3,
                          shadowRadius: 10,
                        }}
                      />
                    ))}
                  </Animated.View>
                  <Animated.View
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <Text
                      style={{
                        fontWeight: "bold",
                        marginRight: 5,
                        color: textColor,
                      }}
                    >
                      Members
                    </Text>
                    <FlatList
                      data={item.idMembers
                        .map((id) => memberDetails[id])
                        .filter(Boolean)}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={({ item: member }) => (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            margin: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "normal",
                              marginRight: 5,
                              color: textColor,
                            }}
                          >
                            {member.fullName}
                          </Text>
                          <Image
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 20,
                              marginRight: 10,
                            }}
                            source={{
                              uri:
                                "https://trello-members.s3.amazonaws.com/" +
                                member.id +
                                "/" +
                                member.avatarHash +
                                "/170.png",
                            }}
                          />
                        </View>
                      )}
                      numColumns={2}
                    />
                  </Animated.View>
                </Animated.View>
              )}
            </Animated.View>
          </ImageBackground>
        </Animated.View>
      </PanGestureHandler>
      <Dialog.Container
        visible={showDialog}
        contentStyle={{
          backgroundColor: backgroundColor,
          borderRadius: 15,
        }}
      >
        <Dialog.Title
          style={{
            color: textColor,
          }}
        >
          Assign Labels
        </Dialog.Title>
        <View style={{ alignItems: "center" }}>
          <RNPickerSelect
            onValueChange={(value) => {
              if (value !== null) {
                setSelectedColor(value);
              }
            }}
            items={Object.entries(colorMap).map(([colorName, colorValue]) => ({
              label: colorName,
              value: colorName,
            }))}
            style={{
              useNativeAndroidPickerStyle: false,
              inputIOS: {
                color: "transparent",
                color: "white",
                height: 40,
                justifyContent: "center",
                alignItems: "center",
                padding: 10,
              },
              inputAndroid: {
                color: "transparent",
                borderRadius: 8,
                color: textColor,
                backgroundColor: backgroundColor,
                height: 40,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 8,
              },
            }}
            useNativeAndroidPickerStyle={false}
            textInputProps={{
              color: "transparent",
              width: 250,
              height: 20,
              borderRadius: 10,
              backgroundColor: colorMap[selectedColor],
              borderColor: textColor,
              borderWidth: 1,
              margin: 10,
            }}
          />
        </View>
        <Dialog.Button
          label="Cancel"
          style={{
            color: "orange",
          }}
          onPress={() => setShowDialog(false)}
        />
        <Dialog.Button
          label="Assign"
          style={{
            color: textColor,
          }}
          onPress={assignColor}
        />
      </Dialog.Container>
      <Dialog.Container
        visible={dialogVisible}
        contentStyle={{
          backgroundColor: backgroundColor,
          borderRadius: 15,
        }}
      >
        <Dialog.Title
          style={{
            color: textColor,
          }}
        >
          Change Task
        </Dialog.Title>
        <Dialog.Description
          style={{
            color: textColor,
          }}
        >
          Enter new task title
        </Dialog.Description>
        <Dialog.Input
          style={{
            color: textColor,
          }}
          onChangeText={(text) => setNewTitle(text)}
        />
        <Dialog.Button
          label="Cancel"
          style={{ color: "orange" }}
          onPress={handleCancelchangetask}
        />
        <Dialog.Button
          label="OK"
          style={{ color: textColor }}
          onPress={handleokchangetask}
        />
      </Dialog.Container>
      <Dialog.Container
        visible={memberVisible}
        contentStyle={{
          backgroundColor: backgroundColor,
          borderRadius: 15,
        }}
      >
        <Dialog.Title
          style={{
            color: textColor,
          }}
        >
          Search for a Member
        </Dialog.Title>
        <Dialog.Description
          style={{
            color: textColor,
          }}
        >
          Select a member from the list
        </Dialog.Description>
        <RNPickerSelect
          onValueChange={(value) => setSelectedMember(value)}
          items={members
            .filter((member) => !item.idMembers.includes(member.id))
            .map((member) => ({
              label: member.fullName,
              value: member.username,
            }))}
          style={{
            useNativeAndroidPickerStyle: false,
            inputIOS: {
              color: "white",
              height: 40,
              justifyContent: "center",
              alignItems: "center",
              padding: 10,
            },
            inputAndroid: {
              color: textColor,
              backgroundColor: backgroundColor,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 8,
            },
          }}
        />
        <Dialog.Button
          label="Cancel"
          style={{ color: "orange" }}
          onPress={() => setMemberVisible(false)}
        />
        <Dialog.Button
          label="OK"
          style={{ color: textColor }}
          onPress={handleOkPress}
        />
      </Dialog.Container>
      <Dialog.Container
        visible={choicedialogVisible}
        contentStyle={{ backgroundColor: backgroundColor, borderRadius: 15 }}
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
              label="Change Task"
              style={{ color: textColor }}
              onPress={() => {
                setchoiceDialogVisible();
                setTimeout(changetask, 500);
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
              label="Assign Labels"
              style={{ color: textColor }}
              onPress={() => {
                setchoiceDialogVisible(false);
                setTimeout(assignLabels, 500); // Wait for 1 second before calling assignLabels
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
              label="Assign to a Member"
              style={{ color: textColor }}
              onPress={() => {
                setchoiceDialogVisible(false);
                setTimeout(handlememeberpressed, 500);
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
              label="Delete Task"
              style={{ color: "red" }}
              onPress={() => {
                deleteTask(item.id);
                setchoiceDialogVisible(false);
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
                setchoiceDialogVisible(false);
              }}
            />
          </View>
        </View>
      </Dialog.Container>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  taskItem: {
    margin: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    flex: 1, // Ajoutez ceci
    minHeight: 65, // Et ceci
  },

  gradientGreen: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  gradientRed: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});
