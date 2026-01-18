/**
 * Tests for Input UI Component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "@/components/ui/input";

describe("Input Component", () => {
    describe("Rendering", () => {
        it("should render with default props", () => {
            render(<Input placeholder="Enter text" />);

            const input = screen.getByPlaceholderText("Enter text");
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute("data-slot", "input");
        });

        it("should render with custom className", () => {
            render(<Input className="custom-input" placeholder="Test" />);

            const input = screen.getByPlaceholderText("Test");
            expect(input).toHaveClass("custom-input");
        });

        it("should have default styles", () => {
            render(<Input placeholder="Test" />);

            const input = screen.getByPlaceholderText("Test");
            expect(input.className).toContain("rounded-md");
            expect(input.className).toContain("border");
            expect(input.className).toContain("h-9");
        });
    });

    describe("Types", () => {
        it("should render text input when type not specified", () => {
            render(<Input placeholder="Text" />);

            const input = screen.getByPlaceholderText("Text");
            // Input without type prop doesn't have type attribute set
            expect(input.getAttribute("type")).toBeNull();
        });

        it("should render password input", () => {
            render(<Input type="password" placeholder="Password" />);

            const input = screen.getByPlaceholderText("Password");
            expect(input).toHaveAttribute("type", "password");
        });

        it("should render email input", () => {
            render(<Input type="email" placeholder="Email" />);

            const input = screen.getByPlaceholderText("Email");
            expect(input).toHaveAttribute("type", "email");
        });

        it("should render number input", () => {
            render(<Input type="number" placeholder="Number" />);

            const input = screen.getByPlaceholderText("Number");
            expect(input).toHaveAttribute("type", "number");
        });

        it("should render tel input", () => {
            render(<Input type="tel" placeholder="Phone" />);

            const input = screen.getByPlaceholderText("Phone");
            expect(input).toHaveAttribute("type", "tel");
        });
    });

    describe("Value Handling", () => {
        it("should display value prop", () => {
            render(<Input value="Test Value" onChange={() => { }} placeholder="Test" />);

            const input = screen.getByPlaceholderText("Test") as HTMLInputElement;
            expect(input.value).toBe("Test Value");
        });

        it("should call onChange when value changes", () => {
            const handleChange = jest.fn();
            render(<Input onChange={handleChange} placeholder="Test" />);

            const input = screen.getByPlaceholderText("Test");
            fireEvent.change(input, { target: { value: "New Value" } });

            expect(handleChange).toHaveBeenCalledTimes(1);
        });

        it("should update value on typing", () => {
            const TestComponent = () => {
                const [value, setValue] = React.useState("");
                return (
                    <Input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Type here"
                    />
                );
            };

            render(<TestComponent />);

            const input = screen.getByPlaceholderText("Type here") as HTMLInputElement;
            fireEvent.change(input, { target: { value: "Hello" } });

            expect(input.value).toBe("Hello");
        });
    });

    describe("States", () => {
        it("should be disabled when disabled prop is true", () => {
            render(<Input disabled placeholder="Disabled" />);

            const input = screen.getByPlaceholderText("Disabled");
            expect(input).toBeDisabled();
            expect(input.className).toContain("disabled:opacity-50");
        });

        it("should be readonly when readOnly prop is true", () => {
            render(<Input readOnly value="Read Only" placeholder="Test" />);

            const input = screen.getByPlaceholderText("Test");
            expect(input).toHaveAttribute("readonly");
        });

        it("should be required when required prop is true", () => {
            render(<Input required placeholder="Required" />);

            const input = screen.getByPlaceholderText("Required");
            expect(input).toBeRequired();
        });
    });

    describe("Events", () => {
        it("should call onFocus when focused", () => {
            const handleFocus = jest.fn();
            render(<Input onFocus={handleFocus} placeholder="Test" />);

            const input = screen.getByPlaceholderText("Test");
            fireEvent.focus(input);

            expect(handleFocus).toHaveBeenCalledTimes(1);
        });

        it("should call onBlur when blurred", () => {
            const handleBlur = jest.fn();
            render(<Input onBlur={handleBlur} placeholder="Test" />);

            const input = screen.getByPlaceholderText("Test");
            fireEvent.focus(input);
            fireEvent.blur(input);

            expect(handleBlur).toHaveBeenCalledTimes(1);
        });

        it("should call onKeyDown on key press", () => {
            const handleKeyDown = jest.fn();
            render(<Input onKeyDown={handleKeyDown} placeholder="Test" />);

            const input = screen.getByPlaceholderText("Test");
            fireEvent.keyDown(input, { key: "Enter" });

            expect(handleKeyDown).toHaveBeenCalledTimes(1);
        });
    });

    describe("Validation", () => {
        it("should have aria-invalid styling available", () => {
            render(<Input placeholder="Test" />);

            const input = screen.getByPlaceholderText("Test");
            expect(input.className).toContain("aria-invalid:");
        });

        it("should support minLength validation", () => {
            render(<Input minLength={5} placeholder="Min Length" />);

            const input = screen.getByPlaceholderText("Min Length");
            expect(input).toHaveAttribute("minLength", "5");
        });

        it("should support maxLength validation", () => {
            render(<Input maxLength={10} placeholder="Max Length" />);

            const input = screen.getByPlaceholderText("Max Length");
            expect(input).toHaveAttribute("maxLength", "10");
        });

        it("should support pattern validation", () => {
            render(<Input pattern="[A-Za-z]+" placeholder="Pattern" />);

            const input = screen.getByPlaceholderText("Pattern");
            expect(input).toHaveAttribute("pattern", "[A-Za-z]+");
        });
    });

    describe("Accessibility", () => {
        it("should support aria-label", () => {
            render(<Input aria-label="Search input" placeholder="Search" />);

            const input = screen.getByLabelText("Search input");
            expect(input).toBeInTheDocument();
        });

        it("should support aria-describedby", () => {
            render(
                <>
                    <Input aria-describedby="help-text" placeholder="Test" />
                    <span id="help-text">Helper text</span>
                </>
            );

            const input = screen.getByPlaceholderText("Test");
            expect(input).toHaveAttribute("aria-describedby", "help-text");
        });

        it("should support name attribute for forms", () => {
            render(<Input name="email" placeholder="Email" />);

            const input = screen.getByPlaceholderText("Email");
            expect(input).toHaveAttribute("name", "email");
        });

        it("should support id attribute", () => {
            render(<Input id="my-input" placeholder="Test" />);

            const input = screen.getByPlaceholderText("Test");
            expect(input).toHaveAttribute("id", "my-input");
        });
    });

    describe("File Input", () => {
        it("should render file input type", () => {
            render(<Input type="file" data-testid="file-input" />);

            const input = screen.getByTestId("file-input");
            expect(input).toHaveAttribute("type", "file");
        });

        it("should have file-specific styles", () => {
            render(<Input type="file" placeholder="File" data-testid="file-input" />);

            const input = screen.getByTestId("file-input");
            expect(input.className).toContain("file:");
        });
    });
});
