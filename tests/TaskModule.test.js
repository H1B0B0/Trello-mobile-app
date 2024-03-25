import React from "react";
import { render } from "@testing-library/react-native";
import TaskModule from "../components/TaskModule";

describe("TaskModule", () => {
  it("should render correctly", () => {
    const { getByText } = render(<TaskModule />);

    // Check if "Add a Task" button is in the document
    expect(getByText("Add a Task")).toBeTruthy();
  });

  // Add more test cases for other functionality in TaskModule component
});
