import React, { useContext, useEffect, useState, useRef } from "react";
import {
  Alert,
  View,
  StyleSheet,
  FlatList,
  useColorScheme,
  Button,
  ActivityIndicator,
  LayoutAnimation,
} from "react-native";
import { BlurView } from "expo-blur";
import Dialog from "react-native-dialog";
import { BoardIdContext } from "../contexts/boardID";
import axios from "axios";
import { TRELLO_API_KEY } from "@env";
import * as SecureStore from "expo-secure-store";
import { CardContext } from "../contexts/cards";
import { TaskItem } from "./taskItem";
import { OPENAI_API_KEY } from "@env";

const TaskModule = () => {
  const addTask = async (taskName, stageId) => {
    if (taskName === "") {
      Alert.alert("Task name cannot be empty");
      return;
    }
    // Get the Trello token
    const trelloToken = await SecureStore.getItemAsync("trello_token");

    axios
      .post(
        `https://api.trello.com/1/cards?key=${TRELLO_API_KEY}&token=${trelloToken}`,
        {
          name: taskName,
          idList: stageId,
        }
      )
      .then(async (response) => {
        // Wait for fetchCardsData to finish
        await fetchCardsData();
      })
      .catch((error) => {
        console.error("Error creating task:", error);
        Alert.alert("Error creating task", "Please try again later.");
      });
  };

  const handleOK = () => {
    addTask(taskName, stages[stagesId].id);
    setTaskName("");
    setDialogVisible(false);
  };
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#1C1C1C" : "#Dcdede";
  const textColor = colorScheme === "dark" ? "white" : "black";
  const [isUpdating, setIsUpdating] = useState(false);
  let animationPlayed = false;

  const flatListRef = useRef(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [tasks, setTasks] = useState([]);
  const { boardId, setBoardId } = useContext(BoardIdContext);
  const { stages, setStage } = useContext(CardContext);
  const { stagesId, setStagesId } = useContext(CardContext);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isMovingTask, setIsMovingTask] = useState(false);
  const [memberDetails, setMemberDetails] = useState({});

  let currentStageData;
  if (stages[stagesId]) {
    currentStageData = tasks.find(
      (data) => data.stageId === stages[stagesId].id
    );
  }
  const [isThinking, setIsThinking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePress = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prevState) => (prevState === id ? null : id));
  };
  const currentTasks = currentStageData ? currentStageData.tasks : [];

  const showDialog = () => {
    setDialogVisible(true);
  };

  const handleCancel = () => {
    setDialogVisible(false);
    setTaskName("");
  };

  const fetchBoardMembers = async () => {
    const trelloToken = await SecureStore.getItemAsync("trello_token");

    try {
      const response = await axios.get(
        `https://api.trello.com/1/boards/${boardId}/members?key=${TRELLO_API_KEY}&token=${trelloToken}`
      );

      if (response.status === 200) {
        let details = {};

        await Promise.all(
          response.data.map(async (member) => {
            const memberResponse = await axios.get(
              `https://api.trello.com/1/members/${member.id}?key=${TRELLO_API_KEY}&token=${trelloToken}`
            );

            if (memberResponse.status === 200) {
              details[member.id] = memberResponse.data;
            } else {
              console.error(
                `Error getting details for member ID ${member.id}: ${memberResponse.status}`
              );
            }
          })
        );

        setMemberDetails(details);
      } else {
        console.error(
          `Error getting members for board ID ${boardId}: ${response.status}`
        );
      }
    } catch (error) {
      console.error("Error getting board members:", error);
    }
  };

  const fetchCardsData = async () => {
    if (!isUpdating && !isAddingTask && !isMovingTask && stages.length > 0) {
      if (!animationPlayed) {
        setIsLoading(true);
      }
      const trelloToken = await SecureStore.getItemAsync("trello_token");
      let tasksData = [];
      for (let stage of stages) {
        const response = await axios.get(
          `https://api.trello.com/1/lists/${stage.id}/cards?key=${TRELLO_API_KEY}&token=${trelloToken}&fields=id,name,badges,checkItemStates,closed,dateLastActivity,desc,due,email,idBoard,idChecklists,idLabels,idList,idMembers,idMembersVoted,idShort,labels,limits,locationName,manualCoverAttachment,name,pos,shortLink,shortUrl,subscribed,url,cover`
        );
        tasksData.push({
          stageId: stage.id,
          tasks: response.data.map((card) => ({
            id: card.id,
            title: card.name,
            badges: card.badges,
            checkItemStates: card.checkItemStates,
            closed: card.closed,
            dateLastActivity: card.dateLastActivity,
            desc: card.desc,
            due: card.due,
            email: card.email,
            idBoard: card.idBoard,
            idChecklists: card.idChecklists,
            idLabels: card.idLabels,
            idList: card.idList,
            idMembers: card.idMembers,
            idMembersVoted: card.idMembersVoted,
            idShort: card.idShort,
            labels: card.labels,
            limits: card.limits,
            locationName: card.locationName,
            manualCoverAttachment: card.manualCoverAttachment,
            name: card.name,
            pos: card.pos,
            shortLink: card.shortLink,
            shortUrl: card.shortUrl,
            subscribed: card.subscribed,
            url: card.url,
            cover: card.cover,
          })),
        });
      }
      setTasks(tasksData);
      fetchBoardMembers();
      if (!isUpdating) {
        setIsLoading(false);
      }
      animationPlayed = true;
    }
  };

  const handleSuggestion = async () => {
    setIsThinking(true);

    // Get the current tasks
    const currentStageId = stages[stagesId].id;
    const currentStageData = tasks.find(
      (data) => data.stageId === currentStageId
    );
    const currentTasks = currentStageData ? currentStageData.tasks : []; // Format the tasks into a string
    const tasksString = currentTasks.map((task) => task.title).join(", ");

    // Create the messages for the OpenAI API
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful assistant. Your task is to suggest a new task based on the given tasks. Your responses should be concise, objective, and directly answer the user's request without any additional cordiality or politeness.",
      },
      { role: "user", content: `My current tasks are: ${tasksString}` },
    ];

    // Make the API request
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setIsThinking(false);
        if (!data.choices || data.choices.length === 0) {
          throw new Error("No choices returned from the OpenAI API");
        }
        // Get the suggested task from the response
        const suggestedTask = data.choices[0].message.content;

        // Extract the task suggestion from the response
        let taskSuggestion = "";
        const taskSuggestionMatchQuotes = suggestedTask.match(/"([^"]+)"/);
        const taskSuggestionMatchColon = suggestedTask.match(/: (.+)/);
        if (taskSuggestionMatchQuotes) {
          taskSuggestion = taskSuggestionMatchQuotes[1];
        } else if (taskSuggestionMatchColon) {
          taskSuggestion = taskSuggestionMatchColon[1];
        } else {
          // If no quotes or colon found, use the raw response
          taskSuggestion = suggestedTask;
        }

        // Set the new title to the suggested task
        setTaskName(taskSuggestion);
      })
      .catch((error) => {
        setIsThinking(false);
        console.error("Error getting suggestion from GPT-3:", error);
      });
  };

  useEffect(() => {
    animationPlayed = false;
    fetchCardsData();
  }, [stages]);

  useEffect(() => {
    // Fetch data every 5 seconds
    const intervalId = setInterval(() => {
      if (!isUpdating && !isAddingTask && !isMovingTask) {
        fetchCardsData();
      }
    }, 5000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [stages, isUpdating, isAddingTask, isMovingTask]);

  return (
    <View style={styles.container}>
      <View style={styles.loadingcontainer}>
        {isLoading && <ActivityIndicator size="large" color="#ACACAC" />}
      </View>
      <FlatList
        ref={flatListRef}
        data={currentTasks}
        renderItem={({ item, index }) => (
          <TaskItem
            key={index}
            item={item}
            waitFor={flatListRef}
            tasks={currentTasks}
            setTasks={setTasks}
            stages={stages}
            setIsUpdating={setIsUpdating}
            isExpanded={isExpanded}
            handlePress={handlePress}
            setIsExpanded={setIsExpanded}
            memberDetails={memberDetails}
            setMemberDetails={setMemberDetails}
          />
        )}
        keyExtractor={(item, index) => item.id + index}
        style={styles.taskList}
        ListFooterComponent={<View style={{ height: 120 }} />}
      />
      <View style={styles.borderRadius}>
        <BlurView
          style={[styles.blurView, styles.absolutePosition, { color: "white" }]}
          intensity={20}
          tint={colorScheme}
        >
          <Button
            title="Add a Task"
            onPress={showDialog}
            style={(styles.buttonTask, { color: "white" })}
          />
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
              New Task
            </Dialog.Title>

            <Dialog.Input
              value={taskName}
              onChangeText={setTaskName}
              style={{
                color: textColor,
                maxWidth: "90%",
                minWidth: "80%",
                width: "100%",
              }}
            />
            {isThinking && (
              <ActivityIndicator
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 6,
                  left: 0,
                }}
              />
            )}
            <Dialog.Button
              label="Cancel"
              onPress={handleCancel}
              style={{ color: "orange" }}
            />
            <Dialog.Button
              label="Suggestion ✨"
              style={{ color: textColor }}
              onPress={handleSuggestion}
            />
            <Dialog.Button
              label="OK"
              onPress={handleOK}
              style={{ color: textColor }}
            />
          </Dialog.Container>
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskList: {
    flex: 1,
  },
  taskItem: {
    margin: 10,
    padding: 20,
    borderRadius: 10,
    backgroundColor: "white",
    shadowColor: "black",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  loadingcontainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  blurView: {
    marginBottom: 15,
    borderRadius: 10, // Augmentez cette valeur pour rendre les coins plus arrondis
    padding: 10, // Ajoutez du padding pour donner de l'espace au contenu de la bulle
    marginHorizontal: 20, // Ajoutez des marges horizontales pour donner de l'espace autour de la bulle
  },
  absolutePosition: {
    position: "absolute",
    bottom: 20, // Augmentez cette valeur pour déplacer la bulle vers le haut
    width: "90%", // Réduisez cette valeur pour rendre la bulle plus petite
    alignSelf: "center", // Centre la bulle horizontalement
    overflow: "hidden",
  },
  borderRadius: {
    borderRadius: 30, // Augmentez cette valeur pour rendre les coins plus arrondis
  },

  gradientGreen: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#08D04E",
  },

  gradientRed: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#D03208",
  },
});

export default TaskModule;
