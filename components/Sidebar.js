import React, { useState, useEffect, useContext } from "react";
import {
  Dimensions,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Button,
  useColorScheme,
  ImageBackground,
} from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  runOnJS,
  withTiming,
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialIcons";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { TRELLO_API_KEY } from "@env";
import { BoardIdContext } from "../contexts/boardID";
import { PanGestureHandler } from "react-native-gesture-handler";
import Dialog from "react-native-dialog";
const windowHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;
import { Picker } from "@react-native-picker/picker";

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const Sidebar = ({ setWorkspacesVisibles, workspace }) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const { boardId, setBoardId } = useContext(BoardIdContext);
  const [boards, setBoards] = useState([]);
  const [boardColors, setBoardColors] = useState([]);
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#253337" : "#9DB5C0";
  const textColor = colorScheme === "dark" ? "white" : "black";
  const backgroundColorPopup = colorScheme === "dark" ? "#1C1C1C" : "#Dcdede";
  const backgroundCards = colorScheme === "dark" ? "#1C1C1C" : "#Dcdede";
  const color = colorScheme === "dark" ? "#CA56FA" : "#691463";
  const sidebarAnimation = useSharedValue(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [choicedialogVisible, setchoiceDialogVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState(null);

  const fetchBoards = () => {
    SecureStore.getItemAsync("trello_token")
      .then((token) => {
        if (token) {
          axios
            .get(
              `https://api.trello.com/1/members/me/boards?key=${TRELLO_API_KEY}&token=${token}`
            )
            .then((response) => {
              const fetchedBoards = response.data
                .filter((board) => !board.closed)
                .map((board) => ({
                  name: board.name,
                  id: board.id,
                }));
              setBoards(fetchedBoards);
              const boardExists = fetchedBoards.some(
                (board) => board.id === boardId
              );
              if (!boardId || !boardExists) {
                setBoardId(
                  fetchedBoards.length > 0 ? fetchedBoards[0].id : null
                );
              }
            })
            .catch((error) => console.log("Fetch boards error:", error));
        }
      })
      .catch((error) => console.log("SecureStore error:", error));
  };

  const handleOkChangeBoards = () => {
    setDialogVisible(false);
    console.log("New title: ", newTitle);

    SecureStore.getItemAsync("trello_token")
      .then((token) => {
        if (token) {
          const url = `https://api.trello.com/1/boards/${selectedBoardId}?name=${encodeURIComponent(
            newTitle
          )}&key=${TRELLO_API_KEY}&token=${token}`;
          console.log(url);
          axios
            .put(url)
            .then((response) => {
              setModalVisible(false);

              // Update the name of the selected board in the local state
              setBoards((prevBoards) =>
                prevBoards.map((board) =>
                  board.id === selectedBoardId
                    ? { ...board, name: newTitle }
                    : board
                )
              );
            })
            .catch((error) => {
              console.log("Change board name error:", error);
              alert(
                "Failed to change board name. Make sure your API key and token are correct."
              );
            });
        }
      })
      .catch((error) => {
        console.log("SecureStore error:", error);
      });
  };

  const createBoard = (boardName) => {
    SecureStore.getItemAsync("trello_token")
      .then((token) => {
        if (token) {
          let url = `https://api.trello.com/1/boards/?name=${encodeURIComponent(
            boardName
          )}&key=${TRELLO_API_KEY}&token=${token}`;
          if (selectedTemplateId) {
            url += `&idBoardSource=${selectedTemplateId}`;
          }
          axios
            .post(url)
            .then((response) => {
              axios
                .get(
                  `https://api.trello.com/1/boards/${response.data.id}?fields=name,id,prefs,closed&key=${TRELLO_API_KEY}&token=${token}`
                )
                .then((boardResponse) => {
                  const newBoard = {
                    name: boardResponse.data.name,
                    id: boardResponse.data.id,
                    color:
                      boardResponse.data.prefs.backgroundColor ||
                      boardResponse.data.prefs.backgroundBottomColor,
                    image: boardResponse.data.prefs.sharedSourceUrl,
                    backgroundImage: boardResponse.data.prefs.backgroundImage,
                  };
                  setBoards([...boards, newBoard]);
                  setBoardId(newBoard.id);
                  setModalVisible(false);
                })
                .catch((error) => {
                  console.log("Fetch new board error:", error);
                });
            })
            .catch((error) => {
              console.log("Create board error:", error);
              alert(
                "Failed to create board. Make sure your API key and token are correct."
              );
            });
        }
      })
      .catch((error) => {
        console.log("SecureStore error:", error);
      });
  };

  // Menu des boards (long press)
  const handleLongPress = (boardId) => {
    console.log("Long press on board with ID:", boardId);
    setSelectedBoardId(boardId);
    setchoiceDialogVisible(true);
  };

  const handleChange = () => {
    setchoiceDialogVisible(false);
    setTimeout(() => {
      setDialogVisible(true);
    }, 500);
  };

  const deleteBoard = (boardId) => {
    SecureStore.getItemAsync("trello_token")
      .then((token) => {
        if (token) {
          const url = `https://api.trello.com/1/boards/${boardId}?key=${TRELLO_API_KEY}&token=${token}`;
          axios
            .delete(url)
            .then((response) => {
              const updatedBoards = boards.filter(
                (board) => board.id !== boardId
              );
              setBoards(updatedBoards);
              if (updatedBoards.length > 0) {
                setBoardId(updatedBoards[0].id);
              } else {
                setBoardId(null);
              }
            })
            .catch((error) => {
              console.log("Delete board error:", error);
              alert(
                "Failed to delete board. Make sure your API key and token are correct."
              );
            });
        }
      })
      .catch((error) => {
        console.log("SecureStore error:", error);
      });
  };

  const handleCancel = () => {
    console.log("Cancel board");
    setchoiceDialogVisible(false);
  };

  const onclickworkspaces = () => {
    setWorkspacesVisibles(true);
  };

  useEffect(() => {
    SecureStore.getItemAsync("trello_token")
      .then((token) => {
        if (token) {
          axios
            .get(
              `https://api.trello.com/1/members/me/boards?fields=name,id,prefs,closed&key=${TRELLO_API_KEY}&token=${token}`
            )
            .then((response) => {
              let fetchedBoards = response.data
                .filter((board) => !board.closed)
                .map((board) => {
                  return {
                    name: board.name,
                    id: board.id,
                    color:
                      board.prefs.backgroundColor ||
                      board.prefs.backgroundBottomColor,
                    image: board.prefs.sharedSourceUrl,
                    backgroundImage: board.prefs.backgroundImage,
                  };
                });

              fetchedBoards = fetchedBoards.sort((a, b) =>
                a.name.localeCompare(b.name)
              );

              setBoards(fetchedBoards);

              SecureStore.getItemAsync("selected_board_id").then(
                (storedBoardId) => {
                  const selectedBoardId = fetchedBoards.find(
                    (board) => board.id === storedBoardId
                  )
                    ? storedBoardId
                    : fetchedBoards.length > 0
                    ? fetchedBoards[0].id
                    : null;

                  setBoardId(selectedBoardId);
                }
              );
            })
            .catch((error) => console.log("Fetch boards error:", error));
        }
      })
      .catch((error) => console.log("SecureStore error:", error));
  }, [isSidebarVisible]);

  useEffect(() => {
    if (boardId) {
      SecureStore.setItemAsync("selected_board_id", boardId);
    }
  }, [boardId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBoards();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const colors = boards.map(() => getRandomColor());
    setBoardColors(colors);
  }, [boards]);

  useEffect(() => {
    if (isSidebarVisible && !isAnimating) {
      runOnJS(setIsAnimating)(true);
      sidebarAnimation.value = withSpring(
        0,
        {
          damping: 25, // Increase damping to reduce movements
          stiffness: 200, // Increase stiffness to make the animation faster
          mass: 1.5,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        },
        () => runOnJS(setIsAnimating)(false)
      );
    } else if (!isSidebarVisible && !isAnimating) {
      runOnJS(setIsAnimating)(true);
      sidebarAnimation.value = withTiming(-screenWidth, { duration: 0 }, () =>
        runOnJS(setIsAnimating)(false)
      );
    }
  }, [isSidebarVisible, sidebarAnimation, isAnimating]);

  const sidebarStyle = useAnimatedStyle(() => {
    return {
      width: "40%",
      transform: [{ translateX: sidebarAnimation.value }],
    };
  });

  const openCreateBoardModal = () => {
    setNewBoardName("");
    setModalVisible(true);
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = sidebarAnimation.value;
    },
    onActive: (event, ctx) => {
      if (isSidebarVisible == false) {
        sidebarAnimation.value = ctx.startX + event.translationX;
      }
    },
    onEnd: (event) => {
      if (event.translationX < -30) {
        sidebarAnimation.value = withSpring(-100, {}, () => {
          runOnJS(setIsSidebarVisible)(false);
        });
      } else {
        sidebarAnimation.value = withSpring(0);
      }
    },
  });

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) {
      alert("Please enter a board name.");
      return;
    }
    createBoard(newBoardName);
  };

  return (
    <>
      {isSidebarVisible ? (
        <PanGestureHandler
          onGestureEvent={gestureHandler}
          activeOffsetX={[-10]}
        >
          <Animated.View
            style={[
              styles.sidebar,
              sidebarStyle,
              {
                backgroundColor: backgroundColor,
                shadowColor: textColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setIsSidebarVisible(!isSidebarVisible)}
              style={styles.toggleButton}
              accessibilityLabel="Toggle sidebar"
            >
              <FontAwesome
                name="times-circle"
                size={24}
                style={{ color: textColor }}
              />
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false}>
              {boards.map((board, index) => (
                <TouchableOpacity
                  key={index}
                  onLongPress={() => handleLongPress(board.id)}
                  onPress={() => setBoardId(board.id)}
                  style={{
                    shadowColor: textColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 5,
                  }}
                >
                  <View
                    style={[
                      styles.workspaceItemContainer,
                      {
                        backgroundColor: "#292828",
                        maxHeight: 100,
                        minHeight: 100,
                        overflow: "hidden",
                      },
                    ]}
                  >
                    <ImageBackground
                      source={{ uri: board.image || board.backgroundImage }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "rgba(0,0,0,0.5)",
                          borderRadius: 10,
                          padding: 10,
                          borderColor: "white",
                          borderWidth: 1,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                          }}
                        >
                          {board.name}
                        </Text>
                      </View>
                    </ImageBackground>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(true);
                  openCreateBoardModal();
                }}
                style={[
                  styles.createBoardButton,
                  { backgroundColor: backgroundCards },
                ]}
              >
                <Text
                  style={[styles.createBoardButtonText, { color: textColor }]}
                >
                  Create New Board
                </Text>
              </TouchableOpacity>
              <View
                style={[
                  styles.createBoardButton,
                  { backgroundColor: backgroundCards },
                ]}
              >
                <TouchableOpacity onPress={onclickworkspaces}>
                  <Text
                    style={[styles.createBoardButtonText, { color: textColor }]}
                  >
                    Manage workspace
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </PanGestureHandler>
      ) : (
        <TouchableOpacity
          onPress={() => setIsSidebarVisible(true)}
          style={styles.externalToggleButton}
          accessibilityLabel="Open sidebar"
          testID="sidebar"
        >
          <Icon name="arrow-forward-ios" size={24} style={{ color: color }} />
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View
            style={{
              backgroundColor: backgroundCards,
              borderColor: textColor,
              borderWidth: 0.3,
              padding: 20,
              borderRadius: 10,
            }}
          >
            <TextInput
              style={[
                styles.modalTextInput,
                { color: textColor, marginBottom: 10 },
              ]}
              onChangeText={setNewBoardName}
              value={newBoardName}
              placeholder="Enter Board Name"
              placeholderTextColor={textColor}
            />
            <Text style={{ color: textColor }}>Choose a template:</Text>
            <View
              style={{
                backgroundColor: Platform.select({
                  ios: null,
                  android: textColor,
                }),
                borderRadius: Platform.select({
                  ios: null,
                  android: 10,
                }),
                margin: Platform.select({
                  ios: null,
                  android: 10,
                }),
              }}
            >
              <Picker
                placeholder="Templates"
                selectedValue={selectedTemplateId}
                onValueChange={(itemValue, itemIndex) =>
                  setSelectedTemplateId(itemValue)
                }
              >
                <Picker.Item
                  label="Aucun"
                  value=""
                  color={Platform.select({ ios: textColor, android: null })}
                />
                <Picker.Item
                  label="Tableau agile"
                  value="591ca6422428d5f5b2794aee"
                  color={Platform.select({ ios: textColor, android: null })}
                />
                <Picker.Item
                  label="Réunion hebdo"
                  value="5b78b8c106c63923ffe26520"
                  color={Platform.select({ ios: textColor, android: null })}
                />
                <Picker.Item
                  label="Conduite de projet"
                  value="5c4efa1d25a9692173830e7f"
                  color={Platform.select({ ios: textColor, android: null })}
                />
                <Picker.Item
                  label="Enseignement"
                  value="5ec98d97f98409568dd89dff"
                  color={Platform.select({ ios: textColor, android: null })}
                />
              </Picker>
            </View>
            <View style={{ flexDirection: "row" }}>
              <View style={styles.buttonContainer}>
                <Button
                  title="Cancel"
                  onPress={() => setModalVisible(!modalVisible)}
                />
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  title="Create"
                  onPress={() => {
                    handleCreateBoard();
                    setModalVisible(!modalVisible);
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Dialog.Container
        visible={choicedialogVisible}
        contentStyle={{
          backgroundColor: backgroundColorPopup,
          borderRadius: 15,
        }}
      >
        <Dialog.Title style={{ color: textColor }}>Board Options</Dialog.Title>

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
              label="Change Board Name"
              onPress={handleChange}
              style={{ color: textColor }}
            />
          </View>
          <View
            style={{
              marginBottom: 10,
              borderColor: textColor,
              color: textColor,
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
              label="Delete Board"
              style={{ color: "red" }}
              onPress={() => {
                deleteBoard(selectedBoardId);
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
              onPress={handleCancel}
              style={{ color: "orange" }}
            />
          </View>
        </View>
      </Dialog.Container>

      <Dialog.Container
        visible={dialogVisible}
        contentStyle={{
          backgroundColor: backgroundColorPopup,
          borderRadius: 15,
        }}
      >
        <Dialog.Title style={{ color: textColor }}>
          Change Board Name
        </Dialog.Title>

        <Dialog.Input
          style={{ color: textColor }}
          label="New board name"
          onChangeText={(text) => setNewTitle(text)}
        />
        <Dialog.Button
          label="Cancel"
          onPress={() => setDialogVisible(false)}
          style={{ color: "orange" }}
        />
        <Dialog.Button
          label="Confirm"
          onPress={handleOkChangeBoards}
          style={{ color: textColor }}
        />
      </Dialog.Container>
    </>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    marginTop: Platform.OS === "android" ? 0 : "15%",
    marginLeft: 5,
    height: Platform.OS === "android" ? "100%" : "90%",
    position: "absolute",
    borderRadius: 20,
    zIndex: 1,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },
  modalButtonContainer: {
    margin: 10,
    width: 100,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  modalTextInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "white",
    padding: 10,
    borderRadius: 10,
  },
  buttonContainer: {
    margin: 10,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 10,
    alignSelf: "flex-end",
    margin: 10,
  },
  externalToggleButton: {
    paddingRight: 4,
    marginLeft: 8,
    paddingTop: 8,
    paddingBottom: 8,
    position: "absolute",
    top: windowHeight / 2,
    zIndex: 2,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  workspaceItemContainer: {
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginHorizontal: 10,
  },
  workspaceItem: {
    fontSize: 16,
  },
  createBoardButton: {
    padding: 10,
    margin: 5,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 10,
  },
  createBoardButtonText: {
    textAlign: "center",
  },
});

export default Sidebar;
