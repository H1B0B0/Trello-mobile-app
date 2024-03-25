import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TaskItem } from "../components/taskItem";

describe("TaskItem", () => {
  const mockItem = {
    id: "task1",
    labels: [{ color: "red" }],
    cover: { color: "#253337" },
  };

  it("should render the task item", () => {
    const { getByTestId } = render(<TaskItem item={mockItem} />);
    const taskItem = getByTestId("task-item");

    expect(taskItem).toBeTruthy();
  });
});
