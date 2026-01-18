/**
 * Tests for Button UI Component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button, buttonVariants } from "@/components/ui/button";

describe("Button Component", () => {
    describe("Rendering", () => {
        it("should render with default variant", () => {
            render(<Button>Click me</Button>);

            const button = screen.getByRole("button", { name: /click me/i });
            expect(button).toBeInTheDocument();
            expect(button).toHaveAttribute("data-slot", "button");
        });

        it("should render with children content", () => {
            render(<Button>Submit Form</Button>);

            expect(screen.getByText("Submit Form")).toBeInTheDocument();
        });

        it("should render with custom className", () => {
            render(<Button className="custom-class">Button</Button>);

            const button = screen.getByRole("button");
            expect(button).toHaveClass("custom-class");
        });
    });

    describe("Variants", () => {
        it("should render default variant", () => {
            render(<Button variant="default">Default</Button>);

            const button = screen.getByRole("button");
            expect(button.className).toContain("bg-primary");
        });

        it("should render destructive variant", () => {
            render(<Button variant="destructive">Delete</Button>);

            const button = screen.getByRole("button");
            expect(button.className).toContain("bg-destructive");
        });

        it("should render outline variant", () => {
            render(<Button variant="outline">Outline</Button>);

            const button = screen.getByRole("button");
            expect(button.className).toContain("border");
        });

        it("should render secondary variant", () => {
            render(<Button variant="secondary">Secondary</Button>);

            const button = screen.getByRole("button");
            expect(button.className).toContain("bg-secondary");
        });

        it("should render ghost variant", () => {
            render(<Button variant="ghost">Ghost</Button>);

            const button = screen.getByRole("button");
            expect(button.className).toContain("hover:bg-accent");
        });

        it("should render link variant", () => {
            render(<Button variant="link">Link</Button>);

            const button = screen.getByRole("button");
            expect(button.className).toContain("underline-offset");
        });
    });

    describe("Sizes", () => {
        it("should render default size", () => {
            render(<Button size="default">Default</Button>);

            const button = screen.getByRole("button");
            expect(button.className).toContain("h-9");
        });

        it("should render sm size", () => {
            render(<Button size="sm">Small</Button>);

            const button = screen.getByRole("button");
            expect(button.className).toContain("h-8");
        });

        it("should render lg size", () => {
            render(<Button size="lg">Large</Button>);

            const button = screen.getByRole("button");
            expect(button.className).toContain("h-10");
        });

        it("should render icon size", () => {
            render(<Button size="icon">🔍</Button>);

            const button = screen.getByRole("button");
            expect(button.className).toContain("size-9");
        });
    });

    describe("States", () => {
        it("should be disabled when disabled prop is true", () => {
            render(<Button disabled>Disabled</Button>);

            const button = screen.getByRole("button");
            expect(button).toBeDisabled();
            expect(button.className).toContain("disabled:opacity-50");
        });

        it("should handle click events", () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick}>Clickable</Button>);

            const button = screen.getByRole("button");
            fireEvent.click(button);

            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it("should not trigger click when disabled", () => {
            const handleClick = jest.fn();
            render(<Button disabled onClick={handleClick}>Disabled</Button>);

            const button = screen.getByRole("button");
            fireEvent.click(button);

            expect(handleClick).not.toHaveBeenCalled();
        });
    });

    describe("asChild prop", () => {
        it("should render as Slot when asChild is true", () => {
            render(
                <Button asChild>
                    <a href="/test">Link Button</a>
                </Button>
            );

            const link = screen.getByRole("link", { name: /link button/i });
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute("href", "/test");
        });
    });

    describe("buttonVariants function", () => {
        it("should generate correct class names for default", () => {
            const classes = buttonVariants({ variant: "default", size: "default" });

            expect(classes).toContain("bg-primary");
            expect(classes).toContain("h-9");
        });

        it("should generate correct class names with custom className", () => {
            const classes = buttonVariants({
                variant: "outline",
                size: "lg",
                className: "my-custom-class"
            });

            expect(classes).toContain("border");
            expect(classes).toContain("h-10");
            expect(classes).toContain("my-custom-class");
        });
    });

    describe("Accessibility", () => {
        it("should have proper button role", () => {
            render(<Button>Accessible</Button>);

            const button = screen.getByRole("button");
            expect(button).toBeInTheDocument();
        });

        it("should support aria-label", () => {
            render(<Button aria-label="Close dialog">×</Button>);

            const button = screen.getByRole("button", { name: /close dialog/i });
            expect(button).toBeInTheDocument();
        });

        it("should support type attribute", () => {
            render(<Button type="submit">Submit</Button>);

            const button = screen.getByRole("button");
            expect(button).toHaveAttribute("type", "submit");
        });
    });
});
