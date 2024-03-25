import React from "react";
import Sidebar from "../components/Sidebar";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
describe("Sidebar", () => {
  it("should find Sidebar container", () => {
    const { getByTestId } = render(<Sidebar />);
    const sidebar = getByTestId("sidebar");

    expect(sidebar).toBeTruthy();
  });
  // Add more tests as needed
});
