import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders GrindMap title", () => {
  render(<App />);
  const titleElement = screen.getByText(/GrindMap/i);
  expect(titleElement).toBeInTheDocument();
});
