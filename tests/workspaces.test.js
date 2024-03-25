import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import axios from "axios";
import Workspaces from "../components/workspaces";

jest.mock("axios");

describe("Workspaces", () => {
  it("should render the workspaces", async () => {
    const mockWorkspaces = [
      {
        id: "workspace1",
        displayName: "Workspace 1",
        desc: "Description 1",
        website: "https://workspace1.com",
      },
      {
        id: "workspace2",
        displayName: "Workspace 2",
        desc: "Description 2",
        website: "https://workspace2.com",
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockWorkspaces });

    const { findByText } = render(<Workspaces />);

    // Wait for the workspaces to load
    // Wait for the workspaces to load
    await waitFor(() => findByText("Workspace 1"), { timeout: 5000 });
    // Assert that the workspaces are rendered
    expect(await findByText("Workspace 1")).toBeTruthy();
    expect(await findByText("Workspace 2")).toBeTruthy();
  });
});
