import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Button,
  ActivityIndicator,
  Linking,
} from "react-native";
import axios from "axios";
import { TRELLO_API_KEY } from "@env";
import * as SecureStore from "expo-secure-store";
import { Avatar, Card, Text } from "react-native-paper";
import UserAvatar from "react-native-user-avatar";
import Dialog from "react-native-dialog";
import { BlurView } from "expo-blur";

const Workspaces = ({ setWorkspace, setWorkspacesVisibles }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [choiceboxVisible, setChoiceboxVisible] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState("");
  const [UpdateWorkspace, setUpdateWorkspace] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [workSpace, setWorkSpace] = useState("");
  const [loading, setLoading] = useState(false);
  const [newName, setName] = useState("");
  const LeftContent = (props) => <Avatar.Icon {...props} icon="rocket" />;
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#424242" : "#B2BABB";
  const textColor = colorScheme === "dark" ? "white" : "black";
  const linkColor = colorScheme === "dark" ? "cyan" : "blue";
  let animationPlayed = false;

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!animationPlayed) {
        setLoading(true);
      }
      const token = await SecureStore.getItemAsync("trello_token");

      const response = await axios.get(
        "https://api.trello.com/1/members/me/organizations",
        {
          params: {
            key: TRELLO_API_KEY,
            token: token,
          },
        }
      );
      if (!animationPlayed) {
        setLoading(false);
      }
      animationPlayed = true;
      setWorkspaces(response.data);
    };

    const intervalId = setInterval(fetchWorkspaces, 1000); // fetch every 5 seconds

    return () => clearInterval(intervalId); // cleanup on unmount
  }, []);

  const createNewWorkspace = async (displayName) => {
    setShowDialog(false);
    setLoading(true);
    const token = await SecureStore.getItemAsync("trello_token");

    try {
      await axios.post(
        `https://api.trello.com/1/organizations?key=${TRELLO_API_KEY}&token=${token}`,
        {
          displayName: displayName,
        }
      );
      console.log(`Workspace ${displayName} created successfully`);
    } catch (error) {
      Alert.alert("Error", "Failed to create new workspace");
      console.error(`Failed to create new workspace: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const ChangeNameofWorkspace = async (workspaceId, newName) => {
    setLoading(true);
    const token = await SecureStore.getItemAsync("trello_token");

    try {
      await axios.put(
        `https://api.trello.com/1/organizations/${workspaceId}?key=${TRELLO_API_KEY}&token=${token}`,
        {
          displayName: newName,
        }
      );
    } catch (error) {
      Alert.alert("Error", "Failed to change name of workspace");
      console.error(`Failed to change name of workspace: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const DeleteWorkspace = async (workspaceId) => {
    setLoading(true);
    const token = await SecureStore.getItemAsync("trello_token");

    try {
      await axios.delete(
        `https://api.trello.com/1/organizations/${workspaceId}?key=${TRELLO_API_KEY}&token=${token}`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to delete workspace");
      console.error(`Failed to delete workspace: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handlelongpress = (workspaceId) => {
    setChoiceboxVisible(true);
    setCurrentWorkspace(workspaceId);
  };

  const handlePress = (workspaceId) => {
    console.log("workspaceId:", workspaceId);
    setWorkspace(workspaceId);
    setWorkspacesVisibles(false);
  };

  const renderItem = ({ item: workspace }) => (
    <TouchableOpacity
      onLongPress={() => handlelongpress(workspace.id)}
      onPress={() => handlePress(workspace.id)}
      style={{ flex: 1 }}
    >
      <Card
        style={{
          margin: 10,
          backgroundColor: backgroundColor,
        }}
      >
        <Card.Title
          title={workspace.displayName}
          left={LeftContent}
          titleStyle={{ color: textColor, fontSize: 20, fontWeight: "bold" }}
        />
        <Card.Content style={{ margin: 5 }}>
          <Text style={{ fontSize: 16, color: textColor, margin: 5 }}>
            <Text style={{ fontWeight: "bold", color: textColor }}>
              Description
            </Text>
            {"\n"}
            {workspace.desc}
          </Text>
          <Text style={{ fontSize: 16, color: textColor, margin: 5 }}>
            <Text style={{ fontWeight: "bold", color: textColor, margin: 5 }}>
              Website
            </Text>
            {"\n"}
            <TouchableOpacity
              onPress={() => Linking.openURL(workspace.website)}
            >
              <Text style={{ color: linkColor, margin: 5 }}>
                {workspace.website}
              </Text>
            </TouchableOpacity>
          </Text>
        </Card.Content>
        <UserAvatar
          style={{
            alignSelf: "center",
            borderRadius: 10,
            height: "35%",
            width: "97%",
            borderColor: "white",
            borderWidth: 1,
          }}
          size={160}
          name={workspace.displayName}
        />
      </Card>
      <Dialog.Container
        visible={UpdateWorkspace}
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
          Update Workspace
        </Dialog.Title>
        <Dialog.Description
          style={{
            color: textColor,
          }}
        >
          Enter new name for the workspace
        </Dialog.Description>
        <Dialog.Input
          style={{
            color: textColor,
          }}
          onChangeText={(text) => setName(text)}
        />
        <Dialog.Button
          label="Cancel"
          style={{ color: "orange" }}
          onPress={() => setUpdateWorkspace(false)}
        />
        <Dialog.Button
          label="OK"
          style={{ color: textColor }}
          onPress={() => {
            ChangeNameofWorkspace(currentWorkspace, newName);
            setUpdateWorkspace(false);
          }}
        />
      </Dialog.Container>
      <Dialog.Container
        visible={choiceboxVisible}
        contentStyle={{ backgroundColor: backgroundColor, borderRadius: 15 }}
      >
        <Dialog.Title>Workspace Options</Dialog.Title>
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
              label="Update Workspace"
              style={{ color: textColor }}
              onPress={() => {
                setChoiceboxVisible(false);
                setTimeout(() => setUpdateWorkspace(true), 500);
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
              label="Delete Workspaces"
              style={{ color: "red" }}
              onPress={() => {
                DeleteWorkspace(currentWorkspace);
                setChoiceboxVisible(false);
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
                setChoiceboxVisible(false);
              }}
            />
          </View>
        </View>
      </Dialog.Container>
    </TouchableOpacity>
  );

  return (
    <>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="grey" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <FlatList
          data={workspaces}
          renderItem={renderItem}
          keyExtractor={(workspace) => workspace.id}
          numColumns={1}
        />
        <BlurView
          style={[styles.blurView, styles.absolutePosition]}
          intensity={20}
          tint={colorScheme}
        >
          <Button
            title="Add a Workspace"
            onPress={() => setShowDialog(true)}
            style={[styles.addbutton]}
          />
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
              New Workspace
            </Dialog.Title>
            <Dialog.Input
              value={workSpace}
              onChangeText={setWorkSpace}
              style={{
                color: textColor,
              }}
            />
            <Dialog.Button
              label="Cancel"
              onPress={() => setShowDialog(false)}
              style={{ color: "orange" }}
            />
            <Dialog.Button
              label="OK"
              onPress={() => createNewWorkspace(workSpace)}
              style={{ color: textColor }}
            />
          </Dialog.Container>
        </BlurView>
      </View>
    </>
  );
};

const styles = {
  loadingContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  blurView: {
    marginBottom: 15,
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 20,
  },
  absolutePosition: {
    position: "absolute",
    bottom: 20,
    width: "90%",
    alignSelf: "center",
    overflow: "hidden",
  },

  addbutton: {
    margin: 10,
    padding: 20,
    borderRadius: 10,
    shadowColor: "black",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
};

export default Workspaces;
